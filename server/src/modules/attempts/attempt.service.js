import mongoose from "mongoose";
import Attempt from "./attempt.model.js";
import AttemptQuestion from "../attemptQuestions/attemptQuestion.model.js";
import Answer from "../answers/answer.model.js";
import Assessment from "../assessments/assessment.model.js";
import AssessmentQuestion from "../assessmentQuestions/assessmentQuestion.model.js";
import AssessmentAssignment from "../assessmentAssignments/assessmentAssignment.model.js";
import Candidate from "../candidates/candidate.model.js";
import Result from "../results/result.model.js";
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
    let candidate = await Candidate.findOne({ userId, status: "ACTIVE" });
    if (organizationId && (!candidate || candidate.organizationId.toString() !== organizationId.toString())) {
      candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
    }

    if (!candidate) {
      throw new ApiError(403, "You do not have an active candidate profile");
    }

    const orgId = organizationId || candidate.organizationId;

    // 2. Resolve Assignment
    const assignment = await AssessmentAssignment.findOne({
      _id: assignmentId,
      organizationId: orgId,
      candidateId: candidate._id,
      status: { $in: ["ASSIGNED", "INVITED", "STARTED"] },
    });

    if (!assignment) {
      throw new ApiError(403, "You do not have an active assignment for this assessment");
    }

    // 3. Resolve Assessment
    const assessment = await Assessment.findOne({
      _id: assignment.assessmentId,
      organizationId: orgId,
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
      organizationId: orgId,
      assignmentId,
      candidateId: candidate._id,
      status: ATTEMPT_STATUSES.IN_PROGRESS,
    });

    if (existingActiveAttempt) {
      if (now >= new Date(existingActiveAttempt.expiresAt)) {
        existingActiveAttempt.status = ATTEMPT_STATUSES.EXPIRED;
        await existingActiveAttempt.save();
      } else {
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

    const maxAllowedAttempts = assignment.attemptsAllowed || assignment.attemptLimit || assessment.settings?.maxAttempts || 1;
    if (completedAttemptsCount >= maxAllowedAttempts) {
      throw new ApiError(403, `Maximum attempt limit (${maxAllowedAttempts}) reached for this assessment`);
    }

    const attemptNumber = completedAttemptsCount + 1;
    const durationSeconds = assessment.durationSeconds || 3600;

    // 7. Calculate Server-Authoritative Effective Expiry
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
      organizationId: orgId,
    }).sort({ order: 1 });

    if (assessmentQuestions.length === 0) {
      throw new ApiError(400, "Assessment has no questions configured");
    }

    // 9. Question Shuffling
    if (assessment.settings?.shuffleQuestions) {
      assessmentQuestions = shuffleArray(assessmentQuestions);
    }

    // 10. Create Attempt
    const attempt = await Attempt.create({
      organizationId: orgId,
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
      totalMarks: assessment.totalPoints || 0,
      lastActivityAt: now,
    });

    // 11. Create Attempt Questions with Option Shuffling
    const attemptQuestionsToInsert = assessmentQuestions.map((q, index) => {
      let candidateOptions = (q.options || []).map((opt) => ({
        id: opt.id,
        text: opt.text,
      }));

      if (assessment.settings?.shuffleOptions) {
        candidateOptions = shuffleArray(candidateOptions);
      }

      return {
        organizationId: orgId,
        attemptId: attempt._id,
        assessmentQuestionId: q._id,
        questionId: q.questionId,
        sectionId: q.sectionId,
        order: index + 1,
        marks: q.marks || q.points || 1,
        points: q.points || q.marks || 1,
        negativeMarks: q.negativeMarks || 0,
        type: q.type,
        prompt: q.prompt,
        options: candidateOptions,
        questionSnapshot: q.snapshot || {},
        status: "NOT_VISITED",
        flagged: false,
      };
    });

    await AttemptQuestion.insertMany(attemptQuestionsToInsert);

    // Update assignment status to STARTED
    assignment.status = "STARTED";
    await assignment.save();

    return this.formatCandidateAttemptDTO(attempt, assessment);
  }

  static async getAttempts(userId, organizationId, query = {}) {
    const candidate = await Candidate.findOne({ userId });
    if (!candidate) return { items: [], pagination: { total: 0 } };

    const filter = { candidateId: candidate._id };
    if (organizationId) filter.organizationId = organizationId;
    if (query.status) filter.status = query.status;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Attempt.find(filter)
        .populate("assessmentId", "title code duration durationSeconds")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attempt.countDocuments(filter),
    ]);

    return {
      items: items.map((a) => this.formatCandidateAttemptDTO(a, a.assessmentId)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getAttempt(userId, organizationId, attemptId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      candidateId: candidate._id,
    }).populate("assessmentId", "title duration durationSeconds instructions settings securitySettings attemptSettings navigation");

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

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

    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    const [questions, answers] = await Promise.all([
      AttemptQuestion.find({ attemptId: attempt._id }).sort({ order: 1 }).lean(),
      Answer.find({ attemptId: attempt._id, candidateId: candidate._id }).lean(),
    ]);

    const answerMap = new Map(answers.map((a) => [a.attemptQuestionId.toString(), a.answer]));

    return questions.map((q) => ({
      _id: q._id,
      id: q._id,
      order: q.order,
      sectionId: q.sectionId,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      marks: q.marks || q.points,
      points: q.points || q.marks,
      status: q.status,
      flagged: Boolean(q.flagged),
      visitedAt: q.visitedAt,
      answeredAt: q.answeredAt,
      savedAnswer: answerMap.get(q._id.toString()) || null,
    }));
  }

  static async getAttemptQuestion(userId, organizationId, attemptId, attemptQuestionId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(attemptQuestionId)) {
      throw new ApiError(400, "Invalid ID format");
    }

    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
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

    const answerDoc = await Answer.findOne({
      attemptId: attempt._id,
      attemptQuestionId: question._id,
    }).lean();

    return {
      _id: question._id,
      id: question._id,
      order: question.order,
      sectionId: question.sectionId,
      type: question.type,
      prompt: question.prompt,
      options: question.options,
      marks: question.marks || question.points,
      points: question.points || question.marks,
      status: question.status,
      flagged: Boolean(question.flagged),
      savedAnswer: answerDoc?.answer || null,
    };
  }

  static async saveAnswer(userId, organizationId, attemptId, attemptQuestionId, answerPayload) {
    if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(attemptQuestionId)) {
      throw new ApiError(400, "Invalid ID format");
    }

    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    const now = new Date();
    if (attempt.status !== ATTEMPT_STATUSES.IN_PROGRESS || now >= new Date(attempt.expiresAt)) {
      if (now >= new Date(attempt.expiresAt)) {
        attempt.status = ATTEMPT_STATUSES.EXPIRED;
        await attempt.save();
      }
      throw new ApiError(400, `Cannot save answer: Attempt is '${attempt.status}'`);
    }

    const question = await AttemptQuestion.findOne({
      _id: attemptQuestionId,
      attemptId: attempt._id,
    });

    if (!question) {
      throw new ApiError(404, "Question not found in this attempt");
    }

    const answerVal = answerPayload.answer !== undefined ? answerPayload.answer : answerPayload;

    const answerDoc = await Answer.findOneAndUpdate(
      { attemptId: attempt._id, attemptQuestionId: question._id },
      {
        organizationId: attempt.organizationId,
        attemptId: attempt._id,
        attemptQuestionId: question._id,
        candidateId: candidate._id,
        answer: answerVal,
        answerType: question.type,
        isAnswered: true,
        savedAt: now,
      },
      { upsert: true, returnDocument: "after" }
    );

    question.status = "ANSWERED";
    question.answeredAt = now;
    await question.save();

    // Recalculate answered count
    const totalAnswered = await Answer.countDocuments({ attemptId: attempt._id, isAnswered: true });
    attempt.answeredQuestions = totalAnswered;
    attempt.lastActivityAt = now;
    await attempt.save();

    return {
      attemptQuestionId: question._id,
      savedAt: answerDoc.savedAt,
      isAnswered: true,
      answeredQuestions: totalAnswered,
    };
  }

  static async flagQuestion(userId, organizationId, attemptId, attemptQuestionId, flagged = true) {
    if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(attemptQuestionId)) {
      throw new ApiError(400, "Invalid ID format");
    }

    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const question = await AttemptQuestion.findOne({
      _id: attemptQuestionId,
      attemptId,
    });

    if (!question) {
      throw new ApiError(404, "Question not found");
    }

    question.flagged = Boolean(flagged);
    if (flagged && question.status !== "ANSWERED") {
      question.status = "FLAGGED_FOR_REVIEW";
    }
    await question.save();

    return { attemptQuestionId: question._id, flagged: question.flagged, status: question.status };
  }

  static async heartbeat(userId, organizationId, attemptId) {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
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

    const candidate = await Candidate.findOne({ userId });
    if (!candidate) {
      throw new ApiError(403, "Access denied");
    }

    const attempt = await Attempt.findOne({
      _id: attemptId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    // Atomic double submission guard
    if (attempt.status === ATTEMPT_STATUSES.SUBMITTED) {
      return {
        status: ATTEMPT_STATUSES.SUBMITTED,
        submittedAt: attempt.submittedAt,
        message: "Attempt was already submitted and locked",
      };
    }

    const now = new Date();
    attempt.status = ATTEMPT_STATUSES.SUBMITTED;
    attempt.submittedAt = now;
    await attempt.save();

    // Auto-calculate objective questions & create Result placeholder
    const questions = await AttemptQuestion.find({ attemptId: attempt._id }).lean();
    const answers = await Answer.find({ attemptId: attempt._id }).lean();
    const answerMap = new Map(answers.map((a) => [a.attemptQuestionId.toString(), a.answer]));

    let earnedPoints = 0;
    let totalPoints = 0;

    for (const q of questions) {
      const qPts = q.marks || q.points || 1;
      totalPoints += qPts;
      const candidateAns = answerMap.get(q._id.toString());

      if (q.type === "SINGLE_CHOICE" && candidateAns) {
        const correctOpt = q.questionSnapshot?.correctAnswer?.optionIds?.[0] || q.questionSnapshot?.correctAnswer;
        if (candidateAns === correctOpt || candidateAns?.selectedOptionId === correctOpt) {
          earnedPoints += qPts;
        } else if (q.negativeMarks) {
          earnedPoints = Math.max(0, earnedPoints - q.negativeMarks);
        }
      } else if (q.type === "TRUE_FALSE" && candidateAns !== undefined && candidateAns !== null) {
        const correctVal = q.questionSnapshot?.correctAnswer?.value !== undefined ? q.questionSnapshot.correctAnswer.value : q.questionSnapshot?.correctAnswer;
        if (candidateAns === correctVal || candidateAns?.value === correctVal) {
          earnedPoints += qPts;
        }
      }
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    attempt.obtainedMarks = earnedPoints;
    attempt.totalMarks = totalPoints;
    attempt.percentage = percentage;
    await attempt.save();

    // Upsert Result record
    await Result.findOneAndUpdate(
      { attemptId: attempt._id },
      {
        organizationId: attempt.organizationId,
        assessmentId: attempt.assessmentId,
        candidateId: candidate._id,
        attemptId: attempt._id,
        earnedPoints,
        totalPoints,
        percentage,
        isPublished: false,
        status: "COMPLETED",
      },
      { upsert: true, returnDocument: "after" }
    );

    return {
      status: ATTEMPT_STATUSES.SUBMITTED,
      submittedAt: attempt.submittedAt,
      earnedPoints,
      totalPoints,
      percentage,
      message: "Attempt submitted successfully",
    };
  }

  static async terminateAttempt(userId, organizationId, attemptId, reason = "") {
    const candidate = await Candidate.findOne({ userId });
    const filter = { _id: attemptId };
    if (candidate) filter.candidateId = candidate._id;
    if (organizationId) filter.organizationId = organizationId;

    const attempt = await Attempt.findOne(filter);
    if (!attempt) throw new ApiError(404, "Attempt not found");

    attempt.status = "TERMINATED";
    attempt.terminationReason = reason;
    await attempt.save();

    return { status: "TERMINATED", terminationReason: reason };
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
