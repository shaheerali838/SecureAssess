import mongoose from "mongoose";
import Report from "./report.model.js";
import Candidate from "../candidates/candidate.model.js";
import { ReportAggregations } from "./report.aggregations.js";
import { AssessmentReportGenerator } from "./generators/assessmentReport.generator.js";
import { CandidateReportGenerator } from "./generators/candidateReport.generator.js";
import { AttemptReportGenerator } from "./generators/attemptReport.generator.js";
import { ProctoringReportGenerator } from "./generators/proctoringReport.generator.js";
import { OrganizationReportGenerator } from "./generators/organizationReport.generator.js";
import { REPORT_TYPES, REPORT_FORMATS, REPORT_STATUSES } from "./report.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";

export class ReportService {
  /**
   * 1. Organization Overview Dashboard
   */
  static async getOrganizationDashboard(organizationId, filters = {}) {
    return ReportAggregations.getOrganizationStatistics(organizationId, filters);
  }

  /**
   * 2. Platform Owner / Admin Dashboard
   */
  static async getPlatformDashboard() {
    return ReportAggregations.getPlatformStatistics();
  }

  /**
   * 3. Assessment Summary Dashboard (Step 32)
   */
  static async getAssessmentSummary(organizationId, assessmentId, filters = {}) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }
    return ReportAggregations.getAssessmentSummary(organizationId, assessmentId, filters);
  }

  /**
   * 4. Assessment Question Analytics Breakdown (Step 32)
   */
  static async getAssessmentQuestions(organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }
    return ReportAggregations.getAssessmentQuestionBreakdown(organizationId, assessmentId);
  }

  /**
   * 5. Assessment Result Analytics & Score Distribution (Step 32)
   */
  static async getAssessmentResults(organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }
    return ReportAggregations.getAssessmentResultStats(organizationId, assessmentId);
  }

  /**
   * 6. Assessment Proctoring Analytics (Step 32)
   */
  static async getAssessmentProctoring(organizationId, assessmentId) {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }
    return ReportAggregations.getAssessmentProctoringStats(organizationId, assessmentId);
  }

  /**
   * 7. Candidate Report (Organization / Staff View)
   */
  static async getCandidateReport(organizationId, candidateId, format = "JSON", filters = {}) {
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid candidate ID format");
    }
    return CandidateReportGenerator.generate(organizationId, candidateId, format, filters);
  }

  /**
   * 8. Candidate Own Performance View (Candidate Self-Service)
   */
  static async getCandidateOwnPerformance(organizationId, userId) {
    const candidate = await Candidate.findOne({ organizationId, userId });
    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found in this organization");
    }
    return ReportAggregations.getCandidateStatistics(organizationId, candidate._id);
  }

  /**
   * 9. Attempt Report
   */
  static async getAttemptReport(organizationId, attemptId, format = "JSON") {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }
    return AttemptReportGenerator.generate(organizationId, attemptId, format);
  }

  /**
   * 10. Proctoring Report
   */
  static async getProctoringReport(organizationId, format = "JSON", filters = {}) {
    return ProctoringReportGenerator.generate(organizationId, format, filters);
  }

  /**
   * 11. Question Analytics
   */
  static async getQuestionAnalytics(organizationId, questionId, filters = {}) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new ApiError(400, "Invalid question ID format");
    }
    return ReportAggregations.getQuestionStatistics(organizationId, questionId, filters);
  }

  /**
   * 12. Assessment Export (CSV / PDF / JSON)
   */
  static async exportAssessment(organizationId, assessmentId, format = "CSV") {
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      throw new ApiError(400, "Invalid assessment ID format");
    }
    return AssessmentReportGenerator.generate(organizationId, assessmentId, format.toUpperCase());
  }

  /**
   * 13. Export & Generate Report Document (Async/Sync)
   */
  static async exportReport(organizationId, userId, { type, format = "CSV", targetId = null, name = null, filters = {} }) {
    const reportName = name || `${type}_Report_${Date.now()}`;
    const report = await Report.create({
      organizationId,
      type,
      name: reportName,
      generatedBy: userId,
      filters: { ...filters, targetId },
      format: format.toUpperCase(),
      status: REPORT_STATUSES.COMPLETED,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days retention
      fileUrl: `/downloads/reports/${reportName}.${format.toLowerCase()}`,
    });

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "GENERATE",
      resource: "REPORT",
      resourceId: report._id,
      description: `Generated report '${reportName}' of type '${type}' in '${format}' format`,
    }).catch(() => {});

    return report;
  }

  /**
   * 14. List generated reports
   */
  static async listReports(organizationId, query = {}) {
    const filter = { organizationId };
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    return Report.find(filter)
      .sort({ createdAt: -1 })
      .populate("generatedBy", "firstName lastName email");
  }

  /**
   * 15. Get report details
   */
  static async getReportById(organizationId, reportId) {
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new ApiError(400, "Invalid report ID format");
    }

    const report = await Report.findOne({ _id: reportId, organizationId })
      .populate("generatedBy", "firstName lastName email");

    if (!report) {
      throw new ApiError(404, "Report not found in this organization");
    }

    return report;
  }

  /**
   * 16. Get interview analytics (Step 51 integration)
   */
  static async getInterviewAnalytics(organizationId, filters = {}) {
    return ReportAggregations.getInterviewStatistics(organizationId, filters);
  }
}
