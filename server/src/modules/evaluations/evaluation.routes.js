import express from "express";
import {
  evaluateAttempt,
  getPendingEvaluations,
  getEvaluationById,
  gradeQuestion,
  finalizeEvaluation,
  recalculateEvaluation,
  regradeAttempt,
  publishResult,
  getEvaluationDetails,
  getCandidateResult,
} from "./evaluation.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Standalone & Nested Staff Evaluation Endpoints ---
router.get(
  "/pending",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.EVALUATIONS_VIEW,
    PERMISSIONS.EVALUATIONS_VIEW
  ),
  getPendingEvaluations
);

router.get(
  "/:evaluationId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.EVALUATIONS_VIEW,
    PERMISSIONS.EVALUATIONS_VIEW
  ),
  getEvaluationById
);

router.post(
  "/:evaluationId/questions/:questionId/grade",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.EVALUATIONS_UPDATE,
    PERMISSIONS.EVALUATIONS_UPDATE
  ),
  gradeQuestion
);

router.post(
  "/:evaluationId/finalize",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.EVALUATIONS_UPDATE,
    PERMISSIONS.EVALUATIONS_UPDATE
  ),
  finalizeEvaluation
);

router.post(
  "/:evaluationId/recalculate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.EVALUATIONS_UPDATE,
    PERMISSIONS.EVALUATIONS_UPDATE
  ),
  recalculateEvaluation
);

// --- Attempts Evaluation Sub-routes ---
router.post(
  "/attempts/:attemptId/evaluate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.EVALUATIONS_CREATE,
    PERMISSIONS.EVALUATIONS_CREATE
  ),
  evaluateAttempt
);

router.post(
  "/attempts/:attemptId/regrade",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.EVALUATIONS_UPDATE,
    PERMISSIONS.EVALUATIONS_UPDATE
  ),
  regradeAttempt
);

router.post(
  "/attempts/:attemptId/publish-result",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.RESULTS_PUBLISH,
    PERMISSIONS.RESULTS_PUBLISH
  ),
  publishResult
);

router.get(
  "/attempts/:attemptId/evaluation",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.EVALUATIONS_VIEW,
    PERMISSIONS.EVALUATIONS_VIEW
  ),
  getEvaluationDetails
);

// --- Candidate Result Endpoint ---
router.get(
  "/candidate/attempts/:attemptId/result",
  requireAuth,
  getCandidateResult
);

export default router;
