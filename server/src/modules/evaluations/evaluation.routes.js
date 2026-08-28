import express from "express";
import {
  evaluateAttempt,
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

// --- Examiner / Staff Evaluation Endpoints ---
// POST /api/v1/organizations/:organizationId/attempts/:attemptId/evaluate
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

// POST /api/v1/organizations/:organizationId/attempts/:attemptId/regrade
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

// POST /api/v1/organizations/:organizationId/attempts/:attemptId/publish-result
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

// GET /api/v1/organizations/:organizationId/attempts/:attemptId/evaluation
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
// GET /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/result
router.get(
  "/candidate/attempts/:attemptId/result",
  requireAuth,
  requireTenantContext,
  getCandidateResult
);

export default router;
