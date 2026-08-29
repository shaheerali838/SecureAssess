import express from "express";
import {
  getMyResults,
  getResultById,
  getResults,
  getAssessmentResults,
  publishResult,
} from "./result.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// Candidate Self-Service Result
router.get("/my", requireAuth, getMyResults);

// Staff List Results
router.get(
  "/",
  requireAuth,
  getResults
);

// Specific Result Details (authorized staff or result owner)
router.get("/:resultId", requireAuth, getResultById);

// Staff: Publish Result
router.post(
  "/:resultId/publish",
  requireAuth,
  publishResult
);

// Staff: Assessment-specific results
router.get(
  "/assessments/:assessmentId",
  requireAuth,
  getAssessmentResults
);

export default router;
