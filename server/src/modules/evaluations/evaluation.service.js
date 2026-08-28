import mongoose from "mongoose";
import Evaluation from "./evaluation.model.js";
import EvaluationItem from "../evaluationItems/evaluationItem.model.js";
import Result from "../results/result.model.js";
import Attempt from "../attempts/attempt.model.js";
import AttemptQuestion from "../attemptQuestions/attemptQuestion.model.js";
import Assessment from "../assessments/assessment.model.js";
import AssessmentQuestion from "../assessmentQuestions/assessmentQuestion.model.js";
import Answer from "../answers/answer.model.js";
import Candidate from "../candidates/candidate.model.js";
import { getGraderForType } from "./graders/index.js";
import { ATTEMPT_STATUSES } from "../../constants/attemptStatuses.js";
import { RESULT_STATUSES } from "../../constants/resultStatuses.js";
import { ApiError } from "../../utils/ApiError.js";

const calculateGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
};

export class EvaluationService {
  /**
   * Evaluates a submitted or expired attempt and generates/updates the result
   */
  static async evaluateAttempt(attemptId, options = {}) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    // 1. Load Attempt
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      throw new ApiError(404, "Attempt not found for evaluation");
    }

    if (![ATTEMPT_STATUSES.SUBMITTED, ATTEMPT_STATUSES.EXPIRED, ATTEMPT_STATUSES.COMPLETED].includes(attempt.status)) {
      throw new ApiError(400, `Cannot evaluate attempt in '${attempt.status}' status. Attempt must be SUBMITTED or EXPIRED.`);
    }

    const { organizationId, assessmentId, candidateId } = attempt;

    // 2. Load Assessment & AssessmentQuestions (for authoritative correct answers)
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      throw new ApiError(404, "Associated assessment not found");
    }

    const [attemptQuestions, answers] = await Promise.all([
      AttemptQuestion.find({ attemptId }).sort({ order: 1 }),
      Answer.find({ attemptId }),
    ]);

    const answersMap = new Map();
    answers.forEach((ans) => {
      answersMap.set(ans.attemptQuestionId.toString(), ans);
    });

    // Fetch authoritative assessment question snapshots
    const assessmentQuestionIds = attemptQuestions.map((aq) => aq.assessmentQuestionId);
    const authoritativeQuestions = await AssessmentQuestion.find({
      _id: { $in: assessmentQuestionIds },
    });
    const authoritativeMap = new Map();
    authoritativeQuestions.forEach((q) => {
      authoritativeMap.set(q._id.toString(), q);
    });

    // 3. Create or Update Evaluation Document
    let evaluation = await Evaluation.findOne({ attemptId, organizationId });
    const version = evaluation ? evaluation.version + 1 : 1;

    if (!evaluation) {
      evaluation = await Evaluation.create({
        organizationId,
        attemptId: attempt._id,
        assessmentId,
        candidateId,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        version,
      });
    } else {
      evaluation.status = "IN_PROGRESS";
      evaluation.version = version;
      await evaluation.save();
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    let hasManualReview = false;

    // 4. Grade Each Question via Grader Strategy (Rule 14 & 15)
    for (const attQuestion of attemptQuestions) {
      const authQuestion = authoritativeMap.get(attQuestion.assessmentQuestionId.toString()) || attQuestion;
      const candidateAnswer = answersMap.get(attQuestion._id.toString());
      const maxPoints = authQuestion.points || 1;
      totalPoints += maxPoints;

      const grader = getGraderForType(authQuestion.type);
      const gradeResult = grader(authQuestion, candidateAnswer, assessment.settings || {});

      if (gradeResult.status === "NEEDS_MANUAL_REVIEW") {
        hasManualReview = true;
      }

      earnedPoints += Number(gradeResult.earnedPoints || 0);

      // Save EvaluationItem
      await EvaluationItem.findOneAndUpdate(
        { evaluationId: evaluation._id, attemptQuestionId: attQuestion._id },
        {
          $set: {
            organizationId,
            evaluationId: evaluation._id,
            attemptId: attempt._id,
            attemptQuestionId: attQuestion._id,
            questionId: authQuestion.questionId || attQuestion.questionId,
            points: maxPoints,
            earnedPoints: gradeResult.earnedPoints,
            scorePercentage: gradeResult.scorePercentage,
            status: gradeResult.status,
            evaluationType: gradeResult.evaluationType,
            feedback: gradeResult.feedback || "",
            evaluatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after" }
      );
    }

    // Floor earnedPoints at 0 if negative marking reduced it below 0
    earnedPoints = Math.max(0, Number(earnedPoints.toFixed(2)));
    totalPoints = Number(totalPoints.toFixed(2));

    const percentage = totalPoints > 0
      ? Number(((earnedPoints / totalPoints) * 100).toFixed(2))
      : 0;

    const passingScore = assessment.passingScore || 60;
    const passed = percentage >= passingScore;
    const grade = calculateGrade(percentage);

    // 5. Finalize Evaluation
    evaluation.status = "COMPLETED";
    evaluation.completedAt = new Date();
    evaluation.evaluationType = hasManualReview ? "HYBRID" : "AUTOMATIC";
    evaluation.totalQuestions = attemptQuestions.length;
    evaluation.evaluatedQuestions = attemptQuestions.length;
    evaluation.totalPoints = totalPoints;
    evaluation.earnedPoints = earnedPoints;
    evaluation.percentage = percentage;
    await evaluation.save();

    // 6. Generate or Update Result (Rule 18 & 21)
    const isAutoPublish = Boolean(assessment.settings?.showResultImmediately);
    const resultStatus = hasManualReview
      ? RESULT_STATUSES.NEEDS_MANUAL_REVIEW
      : passed
      ? RESULT_STATUSES.PASS
      : RESULT_STATUSES.FAIL;

    const result = await Result.findOneAndUpdate(
      { attemptId: attempt._id },
      {
        $set: {
          organizationId,
          attemptId: attempt._id,
          assessmentId,
          candidateId,
          evaluationId: evaluation._id,
          status: resultStatus,
          totalPoints,
          earnedPoints,
          percentage,
          grade,
          passed,
          published: isAutoPublish,
          publishedAt: isAutoPublish ? new Date() : null,
          generatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return { evaluation, result };
  }

  /**
   * Regrades an attempt with version tracking (Rule 24)
   */
  static async regradeAttempt(organizationId, attemptId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const attempt = await Attempt.findOne({ _id: attemptId, organizationId });
    if (!attempt) {
      throw new ApiError(404, "Attempt not found in this organization");
    }

    const output = await this.evaluateAttempt(attempt._id, { regradedBy: userId });
    return output;
  }

  /**
   * Publishes an assessment attempt result to make it visible to the candidate (Rule 21)
   */
  static async publishResult(organizationId, attemptId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const result = await Result.findOneAndUpdate(
      { attemptId, organizationId },
      {
        $set: {
          published: true,
          publishedAt: new Date(),
          publishedBy: userId,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new ApiError(404, "Result not found for this attempt");
    }

    return result;
  }

  /**
   * Examiner View: Detailed evaluation & question-level score breakdown (Rule 23)
   */
  static async getEvaluationDetails(organizationId, attemptId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const [evaluation, result, items] = await Promise.all([
      Evaluation.findOne({ attemptId, organizationId }),
      Result.findOne({ attemptId, organizationId }),
      EvaluationItem.find({ attemptId, organizationId })
        .populate("attemptQuestionId", "order type prompt options points")
        .populate("questionId", "prompt correctAnswer explanation"),
    ]);

    if (!evaluation) {
      throw new ApiError(404, "Evaluation records not found for this attempt");
    }

    return {
      evaluation,
      result,
      items,
    };
  }

  /**
   * Candidate View: Sanitized result delivery (Rule 22 & 30)
   */
  static async getCandidateResult(userId, organizationId, attemptId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const candidate = await Candidate.findOne({ userId, organizationId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const result = await Result.findOne({
      attemptId,
      organizationId,
      candidateId: candidate._id,
    }).populate("assessmentId", "title");

    if (!result) {
      throw new ApiError(404, "Result not found");
    }

    if (!result.published) {
      return {
        status: RESULT_STATUSES.WITHHELD,
        published: false,
        message: "Result has not been published yet by the examiner",
      };
    }

    return {
      status: RESULT_STATUSES.PUBLISHED,
      published: true,
      assessmentTitle: result.assessmentId?.title || "",
      totalPoints: result.totalPoints,
      earnedPoints: result.earnedPoints,
      percentage: result.percentage,
      grade: result.grade,
      passed: result.passed,
      publishedAt: result.publishedAt,
    };
  }
}
