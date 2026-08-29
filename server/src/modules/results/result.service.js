import mongoose from "mongoose";
import Result from "./result.model.js";
import Assessment from "../assessments/assessment.model.js";
import Candidate from "../candidates/candidate.model.js";
import { ApiError } from "../../utils/ApiError.js";

export class ResultService {
  /**
   * Retrieves results for candidate (self-service)
   */
  static async getMyResults(userId, organizationId = null, query = {}) {
    const candidate = await Candidate.findOne({ userId });
    if (!candidate) return { items: [], pagination: { total: 0 } };

    const filter = {
      candidateId: candidate._id,
      published: true, // Only published results visible to candidates
    };

    if (organizationId) filter.organizationId = organizationId;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Result.find(filter)
        .populate("assessmentId", "title code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  /**
   * Retrieves specific result by ID (checking candidate ownership or staff role)
   */
  static async getResultById(resultId, callerUser, organizationId = null) {
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      throw new ApiError(400, "Invalid result ID format");
    }

    const result = await Result.findById(resultId)
      .populate("assessmentId", "title code duration resultSettings")
      .populate("candidateId", "firstName lastName candidateCode email");

    if (!result) {
      throw new ApiError(404, "Result not found");
    }

    // If caller is a candidate, verify ownership and publication status
    const candidate = await Candidate.findOne({ userId: callerUser._id || callerUser.id });
    if (candidate && candidate._id.toString() === result.candidateId._id.toString()) {
      if (!result.published) {
        throw new ApiError(403, "Result has not been published yet");
      }
      return result;
    }

    // If staff, verify organization match
    if (organizationId && result.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(403, "Forbidden. Result belongs to another organization.");
    }

    return result;
  }

  /**
   * Staff: List results for an organization with filters
   */
  static async getResults(organizationId, query = {}) {
    const filter = {};
    if (organizationId) filter.organizationId = organizationId;
    if (query.assessmentId) filter.assessmentId = query.assessmentId;
    if (query.status) filter.status = query.status;
    if (query.passed !== undefined) filter.passed = query.passed === "true";

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Result.find(filter)
        .populate("assessmentId", "title code")
        .populate("candidateId", "firstName lastName candidateCode email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Result.countDocuments(filter),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  /**
   * Staff: List results for a specific assessment
   */
  static async getAssessmentResults(organizationId, assessmentId, query = {}) {
    return this.getResults(organizationId, { ...query, assessmentId });
  }

  /**
   * Staff: Publish single result or batch results
   */
  static async publishResult(organizationId, resultId, publishedByUserId) {
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      throw new ApiError(400, "Invalid result ID format");
    }

    const result = await Result.findOneAndUpdate(
      { _id: resultId, organizationId },
      {
        $set: {
          published: true,
          publishedAt: new Date(),
          publishedBy: publishedByUserId,
          status: "PUBLISHED",
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      throw new ApiError(404, "Result not found in this organization");
    }

    return result;
  }
}
