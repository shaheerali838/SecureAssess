import express from "express";
import {
  getOrganizationDashboard,
  getPlatformDashboard,
  getAssessmentSummary,
  getAssessmentQuestions,
  getAssessmentResults,
  getAssessmentProctoring,
  exportAssessment,
  getCandidateReport,
  getCandidateOwnPerformance,
  getAttemptReport,
  getProctoringReport,
  getQuestionAnalytics,
  exportReport,
  listReports,
  getReportById,
  getInterviewAnalytics,
  downloadReport,
} from "./report.controller.js";
import { exportReportSchema } from "./report.validation.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission, requirePlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Candidate Self-Service Performance Route ---
router.get(
  "/candidate/performance",
  requireAuth,
  requireTenantContext,
  getCandidateOwnPerformance
);

// --- Platform Overview Route ---
router.get(
  "/platform/overview",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.REPORTS_VIEW),
  getPlatformDashboard
);

// --- Organization Reports & Analytics Endpoints ---

// GET /api/v1/reports/dashboard & /api/v1/reports/overview
router.get(
  ["/dashboard", "/overview"],
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getOrganizationDashboard
);

// GET /api/v1/reports/assessments/:assessmentId/summary
router.get(
  ["/assessments/:assessmentId/summary", "/assessments/:assessmentId"],
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getAssessmentSummary
);

// GET /api/v1/reports/assessments/:assessmentId/questions
router.get(
  "/assessments/:assessmentId/questions",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getAssessmentQuestions
);

// GET /api/v1/reports/assessments/:assessmentId/results
router.get(
  "/assessments/:assessmentId/results",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getAssessmentResults
);

// GET /api/v1/reports/assessments/:assessmentId/proctoring
router.get(
  "/assessments/:assessmentId/proctoring",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getAssessmentProctoring
);

// GET /api/v1/reports/assessments/:assessmentId/export
router.get(
  "/assessments/:assessmentId/export",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.REPORTS_EXPORT
  ),
  exportAssessment
);

// GET /api/v1/reports/candidates/:candidateId/performance
router.get(
  ["/candidates/:candidateId/performance", "/candidates/:candidateId"],
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getCandidateReport
);

// GET /api/v1/reports/attempts/:attemptId
router.get(
  "/attempts/:attemptId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getAttemptReport
);

// GET /api/v1/reports/proctoring
router.get(
  "/proctoring",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getProctoringReport
);

// GET /api/v1/reports/questions/:questionId
router.get(
  "/questions/:questionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getQuestionAnalytics
);

// POST /api/v1/reports/export
router.post(
  "/export",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_GENERATE
  ),
  validateRequest(exportReportSchema),
  exportReport
);

// GET /api/v1/reports
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  listReports
);

// GET /api/v1/reports/interviews
router.get(
  "/interviews",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getInterviewAnalytics
);

// GET /api/v1/reports/:reportId/download
router.get(
  "/:reportId/download",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_DOWNLOAD || PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_DOWNLOAD || PERMISSIONS.REPORTS_VIEW
  ),
  downloadReport
);

// GET /api/v1/reports/:reportId
router.get(
  "/:reportId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_VIEW
  ),
  getReportById
);

export default router;
