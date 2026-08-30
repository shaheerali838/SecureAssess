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
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { ATTEMPT_STATUSES } from "../../constants/attemptStatuses.js";
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
   * Automatically grades an attempt upon submission or manual trigger
   */
  static async evaluateAttempt(attemptId, options = {}) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      throw new ApiError(404, "Attempt not found for evaluation");
    }

    if (
      ![
        ATTEMPT_STATUSES.SUBMITTED,
        ATTEMPT_STATUSES.EXPIRED,
        ATTEMPT_STATUSES.COMPLETED,
      ].includes(attempt.status)
    ) {
      throw new ApiError(
        400,
        `Cannot evaluate attempt in '${attempt.status}' status. Attempt must be SUBMITTED or EXPIRED.`,
      );
    }

    const { organizationId, assessmentId, candidateId } = attempt;

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

    const assessmentQuestionIds = attemptQuestions.map(
      (aq) => aq.assessmentQuestionId,
    );
    const authoritativeQuestions = await AssessmentQuestion.find({
      _id: { $in: assessmentQuestionIds },
    });
    const authoritativeMap = new Map();
    authoritativeQuestions.forEach((q) => {
      authoritativeMap.set(q._id.toString(), q);
    });

    let totalMarks = 0;
    let objectiveScore = 0;
    let subjectiveScore = 0;
    let hasManualReview = false;
    const questionResults = [];

    for (const attQuestion of attemptQuestions) {
      const authQuestion =
        authoritativeMap.get(attQuestion.assessmentQuestionId.toString()) ||
        attQuestion;
      const candidateAnswer = answersMap.get(attQuestion._id.toString());
      const marksAvailable =
        authQuestion.marks || authQuestion.points || attQuestion.marks || 1;
      totalMarks += marksAvailable;

      const combinedSettings = {
        ...(assessment.settings || {}),
        ...(assessment.gradingSettings || {}),
      };
      const grader = getGraderForType(authQuestion.type || attQuestion.type);
      const gradeResult = grader(
        authQuestion,
        candidateAnswer,
        combinedSettings,
      );

      const isManual =
        gradeResult.status === "NEEDS_MANUAL_REVIEW" ||
        gradeResult.evaluationType === "MANUAL";
      if (isManual) {
        hasManualReview = true;
      } else {
        objectiveScore += Number(gradeResult.earnedPoints || 0);
      }

      const qResult = {
        attemptQuestionId: attQuestion._id,
        questionId: authQuestion.questionId || attQuestion.questionId,
        questionType: authQuestion.type || attQuestion.type,
        marksAvailable,
        marksAwarded: isManual ? 0 : Number(gradeResult.earnedPoints || 0),
        status: isManual ? "NEEDS_MANUAL_REVIEW" : "EVALUATED",
        candidateAnswer: candidateAnswer?.answer || null,
        correctAnswerUsed:
          authQuestion.correctAnswer ||
          authQuestion.snapshot?.correctAnswer ||
          null,
        evaluatedBy: options.evaluatorUserId || null,
        evaluatedAt: isManual ? null : new Date(),
        feedback: gradeResult.feedback || "",
      };

      questionResults.push(qResult);

      // Save EvaluationItem for granular score breakdown
      await EvaluationItem.findOneAndUpdate(
        { attemptId: attempt._id, attemptQuestionId: attQuestion._id },
        {
          $set: {
            organizationId,
            attemptId: attempt._id,
            attemptQuestionId: attQuestion._id,
            questionId: authQuestion.questionId || attQuestion.questionId,
            points: marksAvailable,
            earnedPoints: qResult.marksAwarded,
            scorePercentage: gradeResult.scorePercentage || 0,
            status: qResult.status,
            evaluationType: isManual ? "MANUAL" : "AUTOMATIC",
            feedback: qResult.feedback,
            evaluatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }

    objectiveScore = Math.max(0, Number(objectiveScore.toFixed(2)));
    totalMarks = Number(totalMarks.toFixed(2));
    const totalScore = Math.max(
      0,
      Number((objectiveScore + subjectiveScore).toFixed(2)),
    );
    const percentage =
      totalMarks > 0 ? Number(((totalScore / totalMarks) * 100).toFixed(2)) : 0;
    const passingScore =
      assessment.gradingSettings?.passingScore || assessment.passingScore || 50;
    const passed = percentage >= passingScore;

    const evaluationStatus = hasManualReview ? "PARTIALLY_GRADED" : "COMPLETED";

    const evaluation = await Evaluation.findOneAndUpdate(
      { attemptId: attempt._id },
      {
        $set: {
          organizationId,
          attemptId: attempt._id,
          assessmentId,
          candidateId,
          status: evaluationStatus,
          gradingMethod: hasManualReview ? "HYBRID" : "AUTOMATIC",
          objectiveScore,
          subjectiveScore,
          totalScore,
          totalMarks,
          percentage,
          passed,
          evaluatedAt: hasManualReview ? null : new Date(),
          evaluatedBy: options.evaluatorUserId || null,
          pendingManualReview: hasManualReview,
          questionResults,
        },
        $inc: { version: 1 },
      },
      { upsert: true, returnDocument: "after" },
    );

    // If fully completed without manual review required, create/update Result
    if (!hasManualReview) {
      const isAutoPublish = Boolean(
        assessment.resultSettings?.visibility === "IMMEDIATE" ||
        assessment.settings?.showResultImmediately,
      );
      const grade = calculateGrade(percentage);

      await Result.findOneAndUpdate(
        { attemptId: attempt._id },
        {
          $set: {
            organizationId,
            assessmentId,
            attemptId: attempt._id,
            candidateId,
            evaluationId: evaluation._id,
            totalMarks,
            obtainedMarks: totalScore,
            percentage,
            grade,
            passed,
            status: "READY",
            published: isAutoPublish,
            publishedAt: isAutoPublish ? new Date() : null,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }

    // Audit Log
    AuditLogService.createAuditLog({
      organizationId,
      actorId: options.evaluatorUserId || null,
      action: "EVALUATE",
      resource: "EVALUATION",
      resourceId: evaluation._id,
      description: `Evaluation processed for attempt '${attempt._id}'. Scored ${totalScore}/${totalMarks} (${percentage.toFixed(1)}%)`,
    }).catch(() => {});

    return evaluation;
  }

  static async getPendingEvaluations(organizationId, query = {}) {
    const filter = { organizationId, pendingManualReview: true };
    if (query.assessmentId) filter.assessmentId = query.assessmentId;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Evaluation.find(filter)
        .populate("assessmentId", "title code")
        .populate("candidateId", "firstName lastName candidateCode email")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Evaluation.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getEvaluationById(organizationId, evaluationId) {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new ApiError(400, "Invalid evaluation ID format");
    }

    const evaluation = await Evaluation.findOne({
      _id: evaluationId,
      organizationId,
    })
      .populate("assessmentId", "title code duration durationSeconds gradingSettings")
      .populate("candidateId", "firstName lastName candidateCode email");

    if (!evaluation) {
      throw new ApiError(404, "Evaluation not found in this organization");
    }

    return evaluation;
  }

  static async gradeQuestion(
    organizationId,
    evaluationId,
    questionId,
    gradePayload,
    examinerUserId,
  ) {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new ApiError(400, "Invalid evaluation ID format");
    }

    const evaluation = await Evaluation.findOne({
      _id: evaluationId,
      organizationId,
    });
    if (!evaluation) {
      throw new ApiError(404, "Evaluation not found");
    }

    const marksAwarded = Number(gradePayload.marksAwarded);
    if (isNaN(marksAwarded) || marksAwarded < 0) {
      throw new ApiError(400, "marksAwarded must be a non-negative number");
    }

    const targetIndex = evaluation.questionResults.findIndex(
      (qr) =>
        qr.questionId.toString() === questionId.toString() ||
        qr.attemptQuestionId.toString() === questionId.toString(),
    );

    if (targetIndex === -1) {
      throw new ApiError(404, "Question not found in evaluation results");
    }

    const targetQR = evaluation.questionResults[targetIndex];
    if (marksAwarded > targetQR.marksAvailable) {
      throw new ApiError(
        400,
        `marksAwarded (${marksAwarded}) cannot exceed marksAvailable (${targetQR.marksAvailable})`,
      );
    }

    targetQR.marksAwarded = marksAwarded;
    targetQR.status = "EVALUATED";
    targetQR.feedback = gradePayload.feedback || targetQR.feedback;
    targetQR.evaluatedBy = examinerUserId;
    targetQR.evaluatedAt = new Date();

    // Recalculate subjective & total score
    let subScore = 0;
    let anyPending = false;

    evaluation.questionResults.forEach((qr) => {
      if (qr.status === "NEEDS_MANUAL_REVIEW") {
        anyPending = true;
      }
      if (
        ["ESSAY", "SHORT_ANSWER", "CODING", "VIDEO_RESPONSE", "MANUAL"].includes(
          qr.questionType,
        )
      ) {
        subScore += qr.marksAwarded || 0;
      }
    });

    evaluation.subjectiveScore = Number(subScore.toFixed(2));
    evaluation.totalScore = Math.max(
      0,
      Number(
        (evaluation.objectiveScore + evaluation.subjectiveScore).toFixed(2),
      ),
    );
    evaluation.percentage =
      evaluation.totalMarks > 0
        ? Number(
            ((evaluation.totalScore / evaluation.totalMarks) * 100).toFixed(2),
          )
        : 0;

    const assessment = await Assessment.findById(evaluation.assessmentId);
    const passingScore = assessment?.gradingSettings?.passingScore || assessment?.passingScore || 50;
    evaluation.passed = evaluation.percentage >= passingScore;
    evaluation.pendingManualReview = anyPending;
    evaluation.status = anyPending ? "PARTIALLY_GRADED" : "COMPLETED";
    evaluation.version += 1;

    await evaluation.save();

    // Audit Log for manual grading
    AuditLogService.createAuditLog({
      organizationId,
      actorId: examinerUserId,
      action: "UPDATE",
      resource: "EVALUATION",
      resourceId: evaluation._id,
      description: `Examiner awarded ${marksAwarded}/${targetQR.marksAvailable} on question ${questionId}`,
    }).catch(() => {});

    return evaluation;
  }

  static async finalizeEvaluation(
    organizationId,
    evaluationId,
    examinerUserId,
  ) {
    const evaluation = await Evaluation.findOne({
      _id: evaluationId,
      organizationId,
    });
    if (!evaluation) {
      throw new ApiError(404, "Evaluation not found");
    }

    const assessment = await Assessment.findById(evaluation.assessmentId);
    const passingScore = assessment?.gradingSettings?.passingScore || assessment?.passingScore || 50;
    const grade = calculateGrade(evaluation.percentage);

    evaluation.status = "COMPLETED";
    evaluation.pendingManualReview = false;
    evaluation.evaluatedAt = new Date();
    evaluation.evaluatedBy = examinerUserId;
    await evaluation.save();

    const isAutoPublish = Boolean(
      assessment?.resultSettings?.visibility === "IMMEDIATE" ||
      assessment?.settings?.showResultImmediately,
    );

    const result = await Result.findOneAndUpdate(
      { attemptId: evaluation.attemptId },
      {
        $set: {
          organizationId,
          assessmentId: evaluation.assessmentId,
          attemptId: evaluation.attemptId,
          candidateId: evaluation.candidateId,
          evaluationId: evaluation._id,
          totalMarks: evaluation.totalMarks,
          obtainedMarks: evaluation.totalScore,
          percentage: evaluation.percentage,
          grade,
          passed: evaluation.percentage >= passingScore,
          status: "READY",
          published: isAutoPublish,
          publishedAt: isAutoPublish ? new Date() : null,
          publishedBy: examinerUserId,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    AuditLogService.createAuditLog({
      organizationId,
      actorId: examinerUserId,
      action: "UPDATE",
      resource: "EVALUATION",
      resourceId: evaluation._id,
      description: `Finalized evaluation for attempt '${evaluation.attemptId}' with score ${evaluation.totalScore}/${evaluation.totalMarks} (${grade})`,
    }).catch(() => {});

    return { evaluation, result };
  }

  static async recalculateEvaluation(
    organizationId,
    evaluationId,
    examinerUserId,
  ) {
    const evaluation = await Evaluation.findOne({
      _id: evaluationId,
      organizationId,
    });
    if (!evaluation) throw new ApiError(404, "Evaluation not found");

    const reEvaluated = await this.evaluateAttempt(evaluation.attemptId, {
      evaluatorUserId: examinerUserId,
    });
    return reEvaluated;
  }

  static async regradeAttempt(organizationId, attemptId, examinerUserId) {
    const attempt = await Attempt.findOne({ _id: attemptId, organizationId });
    if (!attempt) {
      throw new ApiError(404, "Attempt not found in this organization");
    }

    const updated = await this.evaluateAttempt(attempt._id, { evaluatorUserId: examinerUserId });
    return updated;
  }

  static async publishResult(organizationId, attemptId, examinerUserId) {
    const result = await Result.findOne({ attemptId, organizationId });
    if (!result) {
      throw new ApiError(404, "Result not found for this attempt");
    }

    result.published = true;
    result.publishedAt = new Date();
    result.publishedBy = examinerUserId;
    result.status = "PUBLISHED";
    await result.save();

    // Send candidate notification
    const candidate = await Candidate.findById(result.candidateId);
    if (candidate?.userId) {
      NotificationService.createNotification({
        organizationId,
        recipientId: candidate.userId,
        type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
        title: "Assessment Result Published",
        message: `Your result for the assessment has been published. Score: ${result.obtainedMarks}/${result.totalMarks} (${result.grade})`,
        data: { attemptId: result.attemptId, resultId: result._id },
      }).catch(() => {});
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: examinerUserId,
      action: "UPDATE",
      resource: "RESULT",
      resourceId: result._id,
      description: `Published assessment result for candidate '${candidate?.email}'`,
    }).catch(() => {});

    return result;
  }

  static async getEvaluationDetails(organizationId, attemptId) {
    const evaluation = await Evaluation.findOne({ attemptId, organizationId })
      .populate("assessmentId", "title code duration gradingSettings")
      .populate("candidateId", "firstName lastName candidateCode email");

    if (!evaluation) {
      throw new ApiError(404, "Evaluation not found");
    }

    const items = await EvaluationItem.find({ attemptId }).sort({ createdAt: 1 });
    return { evaluation, items };
  }

  static async getCandidateResult(userId, organizationId, attemptId) {
    const candidate = await Candidate.findOne({ userId, organizationId });
    if (!candidate) {
      throw new ApiError(403, "Access denied: Candidate profile not found");
    }

    const result = await Result.findOne({
      attemptId,
      organizationId,
      candidateId: candidate._id,
    }).populate("assessmentId", "title code duration");

    if (!result) {
      throw new ApiError(404, "Result not found");
    }

    if (!result.published) {
      throw new ApiError(403, "Your assessment result is currently under review and has not been published yet.");
    }

    return {
      _id: result._id,
      assessment: result.assessmentId,
      totalMarks: result.totalMarks,
      obtainedMarks: result.obtainedMarks,
      percentage: result.percentage,
      grade: result.grade,
      passed: result.passed,
      publishedAt: result.publishedAt,
    };
  }
}
