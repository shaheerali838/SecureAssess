import mongoose from "mongoose";
import Candidate from "../candidates/candidate.model.js";
import Assessment from "../assessments/assessment.model.js";
import Question from "../questionBank/question.model.js";
import Attempt from "../attempts/attempt.model.js";
import Interview from "../interviews/interview.model.js";
import UserMembership from "../users/userMembership.model.js";

export class UsageService {
  /**
   * Helper to normalize organizationId to ObjectId
   */
  static toObjectId(organizationId) {
    if (!organizationId) return null;
    return mongoose.Types.ObjectId.isValid(organizationId)
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;
  }

  /**
   * Derives authoritative real-time resource counts from the database
   */
  static async calculateResourceUsage(organizationId, resourceKey) {
    const orgId = this.toObjectId(organizationId);
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    switch (resourceKey) {
      case "candidates":
      case "maxCandidates":
        return Candidate.countDocuments({
          organizationId: orgId,
          status: { $ne: "DEACTIVATED" },
        });

      case "assessments":
      case "maxAssessments":
        return Assessment.countDocuments({ organizationId: orgId });

      case "questions":
      case "maxQuestions":
        return Question.countDocuments({
          organizationId: orgId,
          status: { $ne: "DELETED" },
        });

      case "attempts":
      case "maxAttempts":
      case "monthlyAttempts":
        return Attempt.countDocuments({
          organizationId: orgId,
          createdAt: { $gte: startOfMonth },
        });

      case "interviews":
      case "maxInterviews":
        return Interview.countDocuments({
          organizationId: orgId,
          status: { $in: ["SCHEDULED", "LIVE", "COMPLETED", "IN_PROGRESS"] },
        });

      case "users":
      case "staffUsers":
      case "maxUsers":
        return UserMembership.countDocuments({
          organizationId: orgId,
          status: "ACTIVE",
        });

      case "storage":
      case "maxStorage":
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Retrieves full usage metrics for organization dashboard
   */
  static async getOrganizationUsageMetrics(organizationId) {
    const orgId = this.toObjectId(organizationId);
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const [candidates, assessments, questions, attempts, interviews, users] =
      await Promise.all([
        Candidate.countDocuments({
          organizationId: orgId,
          status: { $ne: "DEACTIVATED" },
        }),
        Assessment.countDocuments({ organizationId: orgId }),
        Question.countDocuments({
          organizationId: orgId,
          status: { $ne: "DELETED" },
        }),
        Attempt.countDocuments({
          organizationId: orgId,
          createdAt: { $gte: startOfMonth },
        }),
        Interview.countDocuments({
          organizationId: orgId,
          status: { $in: ["SCHEDULED", "LIVE", "COMPLETED", "IN_PROGRESS"] },
        }),
        UserMembership.countDocuments({
          organizationId: orgId,
          status: "ACTIVE",
        }),
      ]);

    return {
      candidates,
      assessments,
      questions,
      attempts,
      interviews,
      users,
      storage: 0,
    };
  }
}
