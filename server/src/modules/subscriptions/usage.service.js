import Candidate from "../candidates/candidate.model.js";
import Assessment from "../assessments/assessment.model.js";
import Question from "../questionBank/question.model.js";
import Attempt from "../attempts/attempt.model.js";
import Interview from "../interviews/interview.model.js";
import UserMembership from "../users/userMembership.model.js";

export class UsageService {
  /**
   * Derives authoritative real-time resource counts from the database
   */
  static async calculateResourceUsage(organizationId, resourceKey) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    switch (resourceKey) {
      case "candidates":
      case "maxCandidates":
        return Candidate.countDocuments({ organizationId, status: "ACTIVE" });

      case "assessments":
      case "maxAssessments":
        return Assessment.countDocuments({ organizationId });

      case "questions":
      case "maxQuestions":
        return Question.countDocuments({ organizationId, status: { $ne: "DELETED" } });

      case "attempts":
      case "maxAttempts":
      case "monthlyAttempts":
        return Attempt.countDocuments({ organizationId, createdAt: { $gte: startOfMonth } });

      case "interviews":
      case "maxInterviews":
        return Interview.countDocuments({
          organizationId,
          status: { $in: ["SCHEDULED", "LIVE", "COMPLETED"] },
        });

      case "users":
      case "staffUsers":
      case "maxUsers":
        return UserMembership.countDocuments({ organizationId, status: "ACTIVE" });

      case "storage":
      case "maxStorage":
        return 0; // Derived or zero placeholder

      default:
        return 0;
    }
  }

  /**
   * Retrieves full usage metrics for organization dashboard
   */
  static async getOrganizationUsageMetrics(organizationId) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      candidates,
      assessments,
      questions,
      attempts,
      interviews,
      users,
    ] = await Promise.all([
      Candidate.countDocuments({ organizationId, status: "ACTIVE" }),
      Assessment.countDocuments({ organizationId }),
      Question.countDocuments({ organizationId, status: { $ne: "DELETED" } }),
      Attempt.countDocuments({ organizationId, createdAt: { $gte: startOfMonth } }),
      Interview.countDocuments({ organizationId, status: { $in: ["SCHEDULED", "LIVE", "COMPLETED"] } }),
      UserMembership.countDocuments({ organizationId, status: "ACTIVE" }),
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
