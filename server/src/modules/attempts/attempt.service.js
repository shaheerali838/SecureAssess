import mongoose from "mongoose";
import Attempt from "./attempt.model.js";
import AttemptQuestion from "../attemptQuestions/attemptQuestion.model.js";
import Assessment from "../assessments/assessment.model.js";
import AssessmentQuestion from "../assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../assessmentAssignments/assessmentAssignment.model.js";
import Candidate from "../candidates/candidate.model.js";
import { ATTEMPT_STATUSES } from "../../constants/attemptStatuses.js";
import { ASSESSMENT_STATUSES } from "../../constants/assessmentStatuses.js";
import { ApiError } from "../../utils/ApiError.js";

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export class AttemptService {
  /**
   * Starts a new examination attempt or resumes an ongoing one
   */
  static async startAttempt(userId, organizationId, assignmentId, clientInfo = {}) {
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      throw new ApiError(400, "Invalid assignment ID format");
    }

    // 1. Resolve Candidate Profile
    const candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
    if (!candidate) {
      throw new ApiError(403, "You do not have an active candidate profile in this organization");
    }

    // 2. Resolve Assignment
    const assignment = await AssessmentAssignment.findOne({
      _id: assignmentId,
      organizationId,
      candidateId: candidate._id,
      status: { $in: ["ASSIGNED", "INVITED", "STARTED"] },
    });

    if (!assignment) {
      throw new ApiError(403, "You do not have an active assignment for this assessment");
    }

    // 3. Resolve Assessment
    const assessment = await Assessment.findOne({
      _id: assignment.assessmentId,
      organizationId,
      status: { $in: [ASSESSMENT_STATUSES.PUBLISHED, ASSESSMENT_STATUSES.ACTIVE] },
    });

    if (!assessment) {
      throw new ApiError(404, "Assessment is not active or published");
    }

    // 4. Availability Window Check
    const now = new Date();
    if (assignment.availableFrom && now < new Date(assignment.availableFrom)) {
      throw new ApiError(403, `Assessment is not available yet. Opens on ${assignment.availableFrom.toISOString()}`);
    }
    if (assignment.availableUntil && now > new Date(assignment.availableUntil)) {
      throw new ApiError(403, `Assessment has expired on ${assignment.availableUntil.toISOString()}`);
    }

    // 5. Check Existing IN_PROGRESS Attempt (Resume Support / Duplicate Protection)
    const existingActiveAttempt = await Attempt.findOne({
      organizationId,
      assignmentId,
      candidateId: candidate._id,
      status: ATTEMPT_STATUSES.IN_PROGRESS,
    });

    if (existingActiveAttempt) {
      // If already expired according to server time
      if (now >= new Date(existingActiveAttempt.expiresAt)) {
        existingActiveAttempt.status = ATTEMPT_STATUSES.EXPIRED;
        await existingActiveAttempt.save();
      } else {
        // Resume the existing attempt
        existingActiveAttempt.lastActivityAt = now;
        await existingActiveAttempt.save();
        return this.formatCandidateAttemptDTO(existingActiveAttempt, assessment);
      }
    }

    // 6. Check Attempt Limit Policy
    const completedAttemptsCount = await Attempt.countDocuments({
      assignmentId,
      candidateId: candidate._id,
      status: { $in: [ATTEMPT_STATUSES.SUBMITTED, ATTEMPT_STATUSES.EXPIRED, ATTEMPT_STATUSES.COMPLETED] },
    });

    const maxAllowedAttempts = assignment.attemptLimit || assessment.settings?.maxAttempts || 1;
    if (completedAttemptsCount >= maxAllowedAttempts) {
      throw new ApiError(403, `Maximum attempt limit (${maxAllowedAttempts}) reached for this assessment`);
    }

    const attemptNumber = completedAttemptsCount + 1;
    const durationSeconds = assessment.durationSeconds || 3600;

    // 7. Calculate Server-Authoritative Effective Expiry (Rule 8)
    const theoreticalExpiry = new Date(now.getTime() + durationSeconds * 1000);
    const candidateExpiryLimits = [theoreticalExpiry];

    if (assignment.availableUntil) {
      candidateExpiryLimits.push(new Date(assignment.availableUntil));
    }
    if (assessment.scheduling?.endAt) {
      candidateExpiryLimits.push(new Date(assessment.scheduling.endAt));
    }

    const effectiveExpiry = new Date(Math.min(...candidateExpiryLimits.map((d) => d.getTime())));

    // 8. Fetch Assessment Question Snapshots
    let assessmentQuestions = await AssessmentQuestion.find({
      assessmentId: assessment._id,
      organizationId,
    }).sort({ order: 1 });

    if (assessmentQuestions.length === 0) {
      throw new ApiError(400, "Assessment has no questions configured");
    }

    // 9. Question Shuffling (Rule 11)
    if (assessment.settings?.shuffleQuestions) {
      assessmentQuestions = shuffleArray(assessmentQuestions);
    }

    // 10. Create Attempt
    const attempt = await Attempt.create({
      organizationId,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      candidateId: candidate._id,
      attemptNumber,
      status: ATTEMPT_STATUSES.IN_PROGRESS,
      startedAt: now,
      expiresAt: effectiveExpiry,
      durationSeconds,
      startedFromIp: clientInfo.ip || "",
      userAgent: clientInfo.userAgent || "",
      currentQuestionIndex: 0,
      totalQuestions: assessmentQuestions.length,
      answeredQuestions: 0,
      totalPoints: assessment.totalPoints || 0,
      lastActivityAt: now,
    });

    // 11. Create Attempt Questions with Option Shuffling (Rule 10 & 12)
    const attemptQuestionsToInsert = assessmentQuestions.map((q, index) => {
      let candidateOptions = (q.options || []).map((opt) => ({
        id: opt.id,
        text: opt.text,
      }));

      if (assessment.settings?.shuffleOptions) {
        candidateOptions = shuffleArray(candidateOptions);
      }

      return {
        organizationId,
        attemptId: attempt._id,
        assessmentQuestionId: q._id,
        questionId: q.questionId,
        order: index + 1,
        type: q.type,
        prompt: q.prompt,
        options: candidateOptions,
        points: q.points || 1,
        status: "NOT_VISITED",
      };
    });

    await AttemptQuestion.insertMany(attemptQuestionsToInsert);

    // Update assignment status to STARTED
    assignment.status = "STARTED";
    await assignment.save();

    return this.formatCandidateAttemptDTO(attempt, assessment);
  }

  static async getAttempt(userId, organizationId, attemptId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const candidate = await Candidate.findOne({ userId, organizationId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      organizationId,
      candidateId: candidate._id,
    }).populate("assessmentId", "title durationSeconds instructions settings");

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    // Auto-expiry check
    const now = new Date();
    if (attempt.status === ATTEMPT_STATUSES.IN_PROGRESS && now >= new Date(attempt.expiresAt)) {
      attempt.status = ATTEMPT_STATUSES.EXPIRED;
      await attempt.save();
    }

    return this.formatCandidateAttemptDTO(attempt, attempt.assessmentId);
  }

  static async getAttemptQuestions(userId, organizationId, attemptId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const candidate = await Candidate.findOne({ userId, organizationId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      organizationId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    const questions = await AttemptQuestion.find({ attemptId: attempt._id }).sort({ order: 1 });

    return questions.map((q) => ({
      _id: q._id,
      id: q._id,
      order: q.order,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      points: q.points,
      status: q.status,
      visitedAt: q.visitedAt,
      answeredAt: q.answeredAt,
    }));
  }

  static async getAttemptQuestion(userId, organizationId, attemptId, attemptQuestionId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(attemptQuestionId)) {
      throw new ApiError(400, "Invalid ID format");
    }

    const candidate = await Candidate.findOne({ userId, organizationId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      organizationId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    const question = await AttemptQuestion.findOne({
      _id: attemptQuestionId,
      attemptId: attempt._id,
    });

    if (!question) {
      throw new ApiError(404, "Question not found in this attempt");
    }

    if (question.status === "NOT_VISITED") {
      question.status = "VISITED";
      question.visitedAt = new Date();
      await question.save();
    }

    return {
      _id: question._id,
      id: question._id,
      order: question.order,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      points: question.points,
      status: question.status,
    };
  }

  static async heartbeat(userId, organizationId, attemptId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const candidate = await Candidate.findOne({ userId, organizationId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      organizationId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    const now = new Date();
    if (attempt.status === ATTEMPT_STATUSES.IN_PROGRESS && now >= new Date(attempt.expiresAt)) {
      attempt.status = ATTEMPT_STATUSES.EXPIRED;
      await attempt.save();
    } else if (attempt.status === ATTEMPT_STATUSES.IN_PROGRESS) {
      attempt.lastActivityAt = now;
      await attempt.save();
    }

    const timeRemainingSeconds = Math.max(
      0,
      Math.floor((new Date(attempt.expiresAt).getTime() - now.getTime()) / 1000)
    );

    return {
      status: attempt.status,
      lastActivityAt: attempt.lastActivityAt,
      timeRemainingSeconds,
    };
  }

  static async submitAttempt(userId, organizationId, attemptId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const candidate = await Candidate.findOne({ userId, organizationId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      organizationId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    if (attempt.status === ATTEMPT_STATUSES.SUBMITTED) {
      throw new ApiError(400, "Attempt is already submitted and locked");
    }

    const now = new Date();
    if (now > new Date(attempt.expiresAt)) {
      attempt.status = ATTEMPT_STATUSES.EXPIRED;
      attempt.submittedAt = now;
      await attempt.save();
      return {
        status: ATTEMPT_STATUSES.EXPIRED,
        message: "Attempt expired before submission",
      };
    }

    attempt.status = ATTEMPT_STATUSES.SUBMITTED;
    attempt.submittedAt = now;
    await attempt.save();

    return {
      status: ATTEMPT_STATUSES.SUBMITTED,
      submittedAt: attempt.submittedAt,
      message: "Attempt submitted successfully",
    };
  }

  static formatCandidateAttemptDTO(attempt, assessment = {}) {
    const now = new Date();
    const timeRemainingSeconds = Math.max(
      0,
      Math.floor((new Date(attempt.expiresAt).getTime() - now.getTime()) / 1000)
    );

    return {
      id: attempt._id,
      _id: attempt._id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      submittedAt: attempt.submittedAt,
      durationSeconds: attempt.durationSeconds,
      timeRemainingSeconds,
      currentQuestionIndex: attempt.currentQuestionIndex || 0,
      totalQuestions: attempt.totalQuestions || 0,
      answeredQuestions: attempt.answeredQuestions || 0,
      assessment: {
        title: assessment.title || "",
        durationSeconds: assessment.durationSeconds || attempt.durationSeconds,
        settings: assessment.settings || {},
      },
    };
  }
}
