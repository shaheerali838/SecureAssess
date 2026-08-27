import express from "express";
import {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  submitForReview,
  approveAssessment,
  publishAssessment,
  closeAssessment,
  archiveAssessment,
} from "./assessment.controller.js";
import sectionsRouter from "../assessmentSections/index.js";
import questionsRouter from "../assessmentQuestions/index.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Assessment CRUD Routes ---

// POST /api/v1/organizations/:organizationId/assessments
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_CREATE,
    PERMISSIONS.ASSESSMENTS_CREATE
  ),
  createAssessment
);

// GET /api/v1/organizations/:organizationId/assessments
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_VIEW,
    PERMISSIONS.ASSESSMENTS_VIEW
  ),
  getAssessments
);

// GET /api/v1/organizations/:organizationId/assessments/:assessmentId
router.get(
  "/:assessmentId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_VIEW,
    PERMISSIONS.ASSESSMENTS_VIEW
  ),
  getAssessment
);

// PATCH /api/v1/organizations/:organizationId/assessments/:assessmentId
router.patch(
  "/:assessmentId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_UPDATE
  ),
  updateAssessment
);

// DELETE /api/v1/organizations/:organizationId/assessments/:assessmentId
router.delete(
  "/:assessmentId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_DELETE,
    PERMISSIONS.ASSESSMENTS_DELETE
  ),
  deleteAssessment
);

// --- Lifecycle Transition Routes ---

// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/submit-for-review
router.post(
  "/:assessmentId/submit-for-review",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_UPDATE
  ),
  submitForReview
);

// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/approve
router.post(
  "/:assessmentId/approve",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_APPROVE || PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_APPROVE || PERMISSIONS.ASSESSMENTS_UPDATE
  ),
  approveAssessment
);

// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/publish
router.post(
  "/:assessmentId/publish",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_PUBLISH,
    PERMISSIONS.ASSESSMENTS_PUBLISH
  ),
  publishAssessment
);

// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/close
router.post(
  "/:assessmentId/close",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_UPDATE
  ),
  closeAssessment
);

// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/archive
router.post(
  "/:assessmentId/archive",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_DELETE,
    PERMISSIONS.ASSESSMENTS_DELETE
  ),
  archiveAssessment
);

// --- Sub-routes for Sections & Questions ---
router.use("/:assessmentId/sections", sectionsRouter);
router.use("/:assessmentId/questions", questionsRouter);

export default router;
