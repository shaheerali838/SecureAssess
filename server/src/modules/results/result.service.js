import mongoose from "mongoose";
import Result from "./result.model.js";
import Evaluation from "../evaluations/evaluation.model.js";
import Attempt from "../attempts/attempt.model.js";
import Assessment from "../assessments/assessment.model.js";
import Candidate from "../candidates/candidate.model.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { ApiError } from "../../utils/ApiError.js";

const calculateGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
};

export class ResultService {
  /**
   * Generates an official candidate Result from a finalized/completed Evaluation
   */
  static async generateResult(organizationId, evaluationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(evaluationId)) {
      throw new ApiError(400, "Invalid evaluation ID format");
    }

    const evaluation = await Evaluation.findOne({
      _id: evaluationId,
      organizationId,
    });

    if (!evaluation) {
      throw new ApiError(404, "Evaluation not found in this organization");
    }

    if (evaluation.status !== "COMPLETED" || evaluation.pendingManualReview) {
      throw new ApiError(
        400,
        `Cannot generate result from an incomplete evaluation (Current status: '${evaluation.status}', pendingManualReview: ${Boolean(evaluation.pendingManualReview)}). All manual reviews must be completed first.`
      );
    }

    const [attempt, candidate, assessment] = await Promise.all([
      Attempt.findById(evaluation.attemptId),
      Candidate.findById(evaluation.candidateId),
      Assessment.findById(evaluation.assessmentId),
    ]);

    if (!attempt) {
      throw new ApiError(404, "Attempt associated with evaluation not found");
    }
    if (!candidate) {
      throw new ApiError(404, "Candidate associated with evaluation not found");
    }
    if (!assessment) {
      throw new ApiError(404, "Assessment associated with evaluation not found");
    }

    const isAutoPublish = Boolean(
      assessment.resultSettings?.visibility === "IMMEDIATE" ||
      assessment.settings?.showResultImmediately
    );

    const grade = evaluation.grade || calculateGrade(evaluation.percentage);
    const passingScore =
      assessment.gradingSettings?.passingScore || assessment.passingScore || 50;
    const passed = evaluation.percentage >= passingScore;

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
          passed,
          status: isAutoPublish ? "PUBLISHED" : "READY",
          published: isAutoPublish,
          publishedAt: isAutoPublish ? new Date() : null,
          publishedBy: isAutoPublish ? userId : null,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    // If auto-published, notify candidate
    if (isAutoPublish && candidate.userId) {
      NotificationService.createNotification({
        organizationId,
        recipientId: candidate.userId,
        type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
        title: "Assessment Result Available",
        message: `Your result for '${assessment.title}' is available. Score: ${result.obtainedMarks}/${result.totalMarks} (${result.grade})`,
        data: { attemptId: result.attemptId, resultId: result._id },
      }).catch(() => {});
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "CREATE",
      resource: "RESULT",
      resourceId: result._id,
      description: `Generated result for candidate '${candidate.email}' with score ${result.obtainedMarks}/${result.totalMarks} (${result.grade})`,
    }).catch(() => {});

    return result;
  }

  /**
   * Retrieves all published results for authenticated candidate (self-service)
   */
  static async getMyResults(userId, organizationId = null, query = {}) {
    let candidate = await Candidate.findOne({ userId, status: "ACTIVE" });
    if (organizationId && (!candidate || candidate.organizationId.toString() !== organizationId.toString())) {
      candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
    }

    if (!candidate) return { items: [], pagination: { total: 0 } };

    const filter = {
      candidateId: candidate._id,
      published: true, // Only published results visible to candidate
    };

    if (organizationId) filter.organizationId = organizationId;
    if (query.assessmentId) filter.assessmentId = query.assessmentId;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Result.find(filter)
        .populate("assessmentId", "title code duration")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(filter),
    ]);

    return {
      items: items.map((r) => ({
        _id: r._id,
        assessment: r.assessmentId,
        totalMarks: r.totalMarks,
        obtainedMarks: r.obtainedMarks,
        percentage: r.percentage,
        grade: r.grade,
        passed: r.passed,
        publishedAt: r.publishedAt,
        status: r.status,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single candidate result (checking candidate ownership & publication state)
   */
  static async getCandidateResult(userId, organizationId, resultOrAttemptId) {
    if (!mongoose.Types.ObjectId.isValid(resultOrAttemptId)) {
      throw new ApiError(400, "Invalid ID format");
    }

    let candidate = await Candidate.findOne({ userId, status: "ACTIVE" });
    if (organizationId && (!candidate || candidate.organizationId.toString() !== organizationId.toString())) {
      candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
    }

    if (!candidate) {
      throw new ApiError(403, "Access denied: Candidate profile not found");
    }

    const filter = {
      $or: [{ _id: resultOrAttemptId }, { attemptId: resultOrAttemptId }],
      candidateId: candidate._id,
    };
    if (organizationId) filter.organizationId = organizationId;

    const result = await Result.findOne(filter).populate("assessmentId", "title code duration");

    if (!result) {
      throw new ApiError(404, "Result not found");
    }

    if (!result.published) {
      throw new ApiError(
        403,
        "Your assessment result is currently under review and has not been published yet."
      );
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
      status: result.status,
    };
  }

  /**
   * Staff: List results for an organization with filters & pagination
   */
  static async getResults(organizationId, query = {}) {
    const filter = { organizationId };
    if (query.assessmentId) filter.assessmentId = query.assessmentId;
    if (query.candidateId) filter.candidateId = query.candidateId;
    if (query.status) filter.status = query.status;
    if (query.published !== undefined) filter.published = query.published === "true";
    if (query.passed !== undefined) filter.passed = query.passed === "true";

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Result.find(filter)
        .populate("assessmentId", "title code duration")
        .populate("candidateId", "firstName lastName candidateCode email")
        .populate("publishedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(filter),
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

  /**
   * Staff: Get single result details by ID
   */
  static async getResultById(organizationId, resultId) {
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      throw new ApiError(400, "Invalid result ID format");
    }

    const result = await Result.findOne({ _id: resultId, organizationId })
      .populate("assessmentId", "title code duration resultSettings")
      .populate("candidateId", "firstName lastName candidateCode email")
      .populate("evaluationId")
      .populate("publishedBy", "firstName lastName email");

    if (!result) {
      throw new ApiError(404, "Result not found in this organization");
    }

    return result;
  }

  /**
   * Staff: Publish result to candidate
   */
  static async publishResult(organizationId, resultId, publishedByUserId) {
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      throw new ApiError(400, "Invalid result ID format");
    }

    const filter = {
      $or: [{ _id: resultId }, { attemptId: resultId }],
      organizationId,
    };

    const result = await Result.findOneAndUpdate(
      filter,
      {
        $set: {
          published: true,
          publishedAt: new Date(),
          publishedBy: publishedByUserId,
          status: "PUBLISHED",
        },
      },
      { returnDocument: "after" }
    ).populate("candidateId", "userId email firstName lastName");

    if (!result) {
      throw new ApiError(404, "Result not found in this organization");
    }

    // Trigger candidate notification
    if (result.candidateId?.userId) {
      NotificationService.createNotification({
        organizationId,
        recipientId: result.candidateId.userId,
        type: NOTIFICATION_TYPES.RESULT_PUBLISHED,
        title: "Assessment Result Published",
        message: `Your assessment result has been published. Score: ${result.obtainedMarks}/${result.totalMarks} (${result.grade})`,
        data: { attemptId: result.attemptId, resultId: result._id },
      }).catch(() => {});
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: publishedByUserId,
      action: "UPDATE",
      resource: "RESULT",
      resourceId: result._id,
      description: `Published assessment result for candidate '${result.candidateId?.email}'`,
    }).catch(() => {});

    return result;
  }

  /**
   * Staff: Unpublish result (hide from candidate)
   */
  static async unpublishResult(organizationId, resultId, unpublishedByUserId, reason = "") {
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      throw new ApiError(400, "Invalid result ID format");
    }

    const filter = {
      $or: [{ _id: resultId }, { attemptId: resultId }],
      organizationId,
    };

    const result = await Result.findOneAndUpdate(
      filter,
      {
        $set: {
          published: false,
          status: "READY",
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new ApiError(404, "Result not found in this organization");
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: unpublishedByUserId,
      action: "UPDATE",
      resource: "RESULT",
      resourceId: result._id,
      description: `Unpublished assessment result (Reason: ${reason || "Organization review"})`,
    }).catch(() => {});

    return result;
  }
}
