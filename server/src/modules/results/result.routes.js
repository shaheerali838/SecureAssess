import express from "express";
import {
  generateResult,
  getMyResults,
  getCandidateResult,
  getResultById,
  getResults,
  publishResult,
  unpublishResult,
} from "./result.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Candidate Self-Service Result Endpoints ---
// GET /api/v1/results/my (or /candidate-portal/results)
router.get("/my", requireAuth, getMyResults);
router.get("/candidate-portal/results", requireAuth, getMyResults);
router.get("/candidate-portal/results/:resultId", requireAuth, getCandidateResult);

// --- Staff Result Generation & Management Endpoints ---
// POST /api/v1/results/evaluations/:evaluationId/generate
router.post(
  "/evaluations/:evaluationId/generate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.RESULTS_CREATE,
    PERMISSIONS.RESULTS_CREATE
  ),
  generateResult
);

// GET /api/v1/results - List results
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.RESULTS_VIEW,
    PERMISSIONS.RESULTS_VIEW
  ),
  getResults
);

// GET /api/v1/results/:resultId - View result details
router.get(
  "/:resultId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.RESULTS_VIEW,
    PERMISSIONS.RESULTS_VIEW
  ),
  getResultById
);

// POST /api/v1/results/:resultId/publish
router.post(
  "/:resultId/publish",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.RESULTS_PUBLISH,
    PERMISSIONS.RESULTS_PUBLISH
  ),
  publishResult
);

// POST /api/v1/results/:resultId/unpublish
router.post(
  "/:resultId/unpublish",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.RESULTS_PUBLISH,
    PERMISSIONS.RESULTS_PUBLISH
  ),
  unpublishResult
);

export default router;
