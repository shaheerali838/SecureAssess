import mongoose from "mongoose";
import Answer from "./answer.model.js";
import Attempt from "../attempts/attempt.model.js";
import AttemptQuestion from "../attemptQuestions/attemptQuestion.model.js";
import Assessment from "../assessments/assessment.model.js";
import Candidate from "../candidates/candidate.model.js";
import { ATTEMPT_STATUSES } from "../../constants/attemptStatuses.js";
import { QUESTION_TYPES } from "../../constants/questionTypes.js";
import { AnswerValidator } from "./answer.validation.js";
import { ApiError } from "../../utils/ApiError.js";

export class AnswerService {
  /**
   * Autosaves or updates a candidate's answer for an attempt question
   */
  static async saveAnswer(userId, organizationId, attemptId, attemptQuestionId, rawAnswerPayload) {
    if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(attemptQuestionId)) {
      throw new ApiError(400, "Invalid ID format");
    }

    // 1. Resolve Candidate Profile
    const candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
    if (!candidate) {
      throw new ApiError(403, "Access denied: No active candidate profile found");
    }

    // 2. Resolve Attempt & Check State
    const attempt = await Attempt.findOne({
      _id: attemptId,
      organizationId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    if (attempt.status !== ATTEMPT_STATUSES.IN_PROGRESS) {
      throw new ApiError(409, `Attempt is no longer editable. Current status: '${attempt.status}'`);
    }

    const now = new Date();
    if (now >= new Date(attempt.expiresAt)) {
      attempt.status = ATTEMPT_STATUSES.EXPIRED;
      await attempt.save();
      throw new ApiError(409, "Attempt has expired and is locked against modifications");
    }

    // 3. Resolve Attempt Question & Validate Ownership
    const attemptQuestion = await AttemptQuestion.findOne({
      _id: attemptQuestionId,
      attemptId: attempt._id,
      organizationId,
    });

    if (!attemptQuestion) {
      throw new ApiError(404, "Attempt question not found in this attempt");
    }

    // 4. Validate Answer against Question Type (Rule 7 & 12)
    const { isValid, errors } = AnswerValidator.validateAnswerForType(
      attemptQuestion.type,
      rawAnswerPayload
    );
    if (!isValid) {
      throw new ApiError(400, "Invalid answer format for question type", errors);
    }

    // 5. Structure Sanitized Answer & Calculate isAnswered
    const safeAnswer = {
      selectedOptionId: rawAnswerPayload.selectedOptionId || null,
      selectedOptionIds: Array.isArray(rawAnswerPayload.selectedOptionIds)
        ? rawAnswerPayload.selectedOptionIds
        : [],
      text: rawAnswerPayload.text || "",
      code: rawAnswerPayload.code || "",
      language: rawAnswerPayload.language || "",
    };

    let isAnswered = false;
    switch (attemptQuestion.type) {
      case QUESTION_TYPES.SINGLE_CHOICE:
      case QUESTION_TYPES.TRUE_FALSE:
        isAnswered = Boolean(safeAnswer.selectedOptionId);
        break;
      case QUESTION_TYPES.MULTIPLE_CHOICE:
        isAnswered = Boolean(safeAnswer.selectedOptionIds.length > 0);
        break;
      case QUESTION_TYPES.SHORT_ANSWER:
      case QUESTION_TYPES.ESSAY:
        isAnswered = Boolean(safeAnswer.text.trim().length > 0);
        break;
      case QUESTION_TYPES.CODING:
        isAnswered = Boolean(safeAnswer.code.trim().length > 0);
        break;
      default:
        isAnswered = false;
    }

    // 6. Upsert Answer Document (Rule 11 & 25)
    const existing = await Answer.findOne({ attemptId: attempt._id, attemptQuestionId: attemptQuestion._id });
    const version = existing ? (existing.version || 1) + 1 : 1;

    const savedAnswer = await Answer.findOneAndUpdate(
      { attemptId: attempt._id, attemptQuestionId: attemptQuestion._id },
      {
        $set: {
          organizationId,
          attemptId: attempt._id,
          attemptQuestionId: attemptQuestion._id,
          candidateId: candidate._id,
          answer: safeAnswer,
          answerType: attemptQuestion.type,
          isAnswered,
          version,
          savedAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    // 7. Update Attempt Question Status
    attemptQuestion.status = isAnswered ? "ANSWERED" : "VISITED";
    attemptQuestion.answeredAt = isAnswered ? now : null;
    await attemptQuestion.save();

    // 8. Update Denormalized Attempt Statistics (Rule 17)
    const answeredCount = await Answer.countDocuments({
      attemptId: attempt._id,
      isAnswered: true,
    });

    await Attempt.updateOne(
      { _id: attempt._id },
      {
        $set: {
          answeredQuestions: answeredCount,
          lastActivityAt: now,
        },
      }
    );

    return {
      attemptQuestionId: savedAnswer.attemptQuestionId,
      answer: savedAnswer.answer,
      isAnswered: savedAnswer.isAnswered,
      version: savedAnswer.version,
      savedAt: savedAnswer.savedAt,
    };
  }

  /**
   * Retrieves all answers saved for an attempt
   */
  static async getAnswers(userId, organizationId, attemptId) {
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

    const answers = await Answer.find({ attemptId: attempt._id }).sort({ savedAt: 1 });

    return {
      attemptId: attempt._id,
      totalAnswered: attempt.answeredQuestions,
      answers: answers.map((a) => ({
        attemptQuestionId: a.attemptQuestionId,
        answer: a.answer,
        isAnswered: a.isAnswered,
        version: a.version,
        savedAt: a.savedAt,
      })),
    };
  }

  /**
   * Retrieves question details along with candidate's current saved answer
   */
  static async getQuestionAndAnswer(userId, organizationId, attemptId, attemptQuestionId) {
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
      throw new ApiError(404, "Attempt question not found");
    }

    if (question.status === "NOT_VISITED") {
      question.status = "VISITED";
      question.visitedAt = new Date();
      await question.save();
    }

    const answerDoc = await Answer.findOne({
      attemptId: attempt._id,
      attemptQuestionId: question._id,
    });

    return {
      question: {
        _id: question._id,
        id: question._id,
        order: question.order,
        type: question.type,
        prompt: question.prompt,
        options: question.options,
        points: question.points,
        status: question.status,
      },
      answer: answerDoc
        ? {
            answer: answerDoc.answer,
            isAnswered: answerDoc.isAnswered,
            version: answerDoc.version,
            savedAt: answerDoc.savedAt,
          }
        : null,
    };
  }

  /**
   * Updates current question index with back-navigation enforcement
   */
  static async updateCurrentQuestion(userId, organizationId, attemptId, questionIndex) {
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
    }).populate("assessmentId", "settings");

    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    if (attempt.status !== ATTEMPT_STATUSES.IN_PROGRESS) {
      throw new ApiError(409, `Cannot navigate in '${attempt.status}' state`);
    }

    if (questionIndex < 0 || questionIndex >= attempt.totalQuestions) {
      throw new ApiError(400, `questionIndex must be between 0 and ${attempt.totalQuestions - 1}`);
    }

    // Back Navigation Policy Check (Rule 20)
    const allowBackNavigation =
      attempt.assessmentId?.settings?.allowBackNavigation !== false;

    if (!allowBackNavigation && questionIndex < attempt.currentQuestionIndex) {
      throw new ApiError(403, "Back navigation is disabled for this assessment");
    }

    attempt.currentQuestionIndex = questionIndex;
    attempt.lastActivityAt = new Date();
    await attempt.save();

    return {
      attemptId: attempt._id,
      currentQuestionIndex: attempt.currentQuestionIndex,
    };
  }

  /**
   * Atomic attempt submission with unanswered questions policy & race protection (Rules 21, 22, 23)
   */
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
    }).populate("assessmentId", "settings");

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

    // Unanswered Questions Policy Check (Rule 21)
    const allowUnanswered = attempt.assessmentId?.settings?.allowUnanswered !== false;
    const answeredCount = await Answer.countDocuments({ attemptId: attempt._id, isAnswered: true });

    if (!allowUnanswered && answeredCount < attempt.totalQuestions) {
      throw new ApiError(
        400,
        `All questions must be answered before submission. (${answeredCount}/${attempt.totalQuestions} answered)`
      );
    }

    // Atomic Submission Update with Expiration Guard (Rule 23)
    const submittedAttempt = await Attempt.findOneAndUpdate(
      {
        _id: attempt._id,
        organizationId,
        candidateId: candidate._id,
        status: ATTEMPT_STATUSES.IN_PROGRESS,
        expiresAt: { $gt: now },
      },
      {
        $set: {
          status: ATTEMPT_STATUSES.SUBMITTED,
          submittedAt: now,
          answeredQuestions: answeredCount,
        },
      },
      { returnDocument: "after" }
    );

    if (!submittedAttempt) {
      throw new ApiError(409, "Failed to submit attempt: Attempt may have expired or was already submitted concurrently");
    }

    // Freeze all answers for this attempt (Rule 24)
    await Answer.updateMany(
      { attemptId: attempt._id },
      { $set: { submittedAt: now } }
    );

    return {
      status: ATTEMPT_STATUSES.SUBMITTED,
      submittedAt: submittedAttempt.submittedAt,
      totalQuestions: submittedAttempt.totalQuestions,
      answeredQuestions: answeredCount,
      message: "Attempt submitted successfully",
    };
  }
}
