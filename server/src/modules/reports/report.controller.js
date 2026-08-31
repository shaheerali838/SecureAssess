import { ReportService } from "./report.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getOrganizationDashboard = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const result = await ReportService.getOrganizationDashboard(organizationId, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Organization dashboard metrics retrieved"));
});

export const getPlatformDashboard = asyncHandler(async (req, res) => {
  const result = await ReportService.getPlatformDashboard();

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Platform dashboard metrics retrieved"));
});

export const getAssessmentSummary = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { assessmentId } = req.params;

  const result = await ReportService.getAssessmentSummary(
    organizationId,
    assessmentId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Assessment summary analytics retrieved"));
});

export const getAssessmentQuestions = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { assessmentId } = req.params;

  const result = await ReportService.getAssessmentQuestions(
    organizationId,
    assessmentId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Assessment question analytics retrieved"));
});

export const getAssessmentResults = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { assessmentId } = req.params;

  const result = await ReportService.getAssessmentResults(
    organizationId,
    assessmentId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Assessment result distribution analytics retrieved"));
});

export const getAssessmentProctoring = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { assessmentId } = req.params;

  const result = await ReportService.getAssessmentProctoring(
    organizationId,
    assessmentId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Assessment proctoring analytics retrieved"));
});

export const exportAssessment = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { assessmentId } = req.params;
  const format = req.query.format || "CSV";

  const result = await ReportService.exportAssessment(
    organizationId,
    assessmentId,
    format
  );

  if (format.toUpperCase() === "CSV") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="assessment_${assessmentId}_report.csv"`);
    return res.status(200).send(result);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Assessment exported successfully"));
});

export const getCandidateReport = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { candidateId } = req.params;
  const format = req.query.format || "JSON";

  const result = await ReportService.getCandidateReport(
    organizationId,
    candidateId,
    format,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Candidate performance report retrieved"));
});

export const getCandidateOwnPerformance = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const result = await ReportService.getCandidateOwnPerformance(
    organizationId,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Candidate performance retrieved"));
});

export const getAttemptReport = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { attemptId } = req.params;
  const format = req.query.format || "JSON";

  const result = await ReportService.getAttemptReport(
    organizationId,
    attemptId,
    format
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Attempt report generated"));
});

export const getProctoringReport = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const format = req.query.format || "JSON";

  const result = await ReportService.getProctoringReport(
    organizationId,
    format,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring report generated"));
});

export const getQuestionAnalytics = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { questionId } = req.params;

  const result = await ReportService.getQuestionAnalytics(
    organizationId,
    questionId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Question analytics generated"));
});

export const exportReport = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const result = await ReportService.exportReport(
    organizationId,
    userId,
    req.body
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Report generated and export queued"));
});

export const listReports = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const result = await ReportService.listReports(organizationId, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Reports list retrieved"));
});

export const getReportById = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { reportId } = req.params;

  const result = await ReportService.getReportById(organizationId, reportId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Report details retrieved"));
});

export const getInterviewAnalytics = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const result = await ReportService.getInterviewAnalytics(organizationId, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Interview analytics retrieved"));
});

export const downloadReport = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { reportId } = req.params;

  const report = await ReportService.getReportById(organizationId, reportId);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          reportId: report._id,
          name: report.name,
          format: report.format,
          fileUrl: report.fileUrl,
          downloadUrl: `/api/v1/reports/${report._id}/download?file=true`,
        },
        "Report download reference retrieved"
      )
    );
});
