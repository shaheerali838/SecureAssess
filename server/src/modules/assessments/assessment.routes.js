import express from "express";
import {
  createAssessment,
  getAssessments,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
  archiveAssessment,
  duplicateAssessment,
  previewAssessment,
  assignCandidates,
  getAssignments,
  removeAssignment,
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

// --- Lifecycle Actions ---
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

router.post(
  "/:assessmentId/duplicate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_CREATE,
    PERMISSIONS.ASSESSMENTS_CREATE
  ),
  duplicateAssessment
);

router.get(
  "/:assessmentId/preview",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_VIEW,
    PERMISSIONS.ASSESSMENTS_VIEW
  ),
  previewAssessment
);

// --- Candidate Assignments ---
router.post(
  "/:assessmentId/assign",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE || PERMISSIONS.ASSESSMENTS_CREATE,
    PERMISSIONS.ASSESSMENTS_UPDATE || PERMISSIONS.ASSESSMENTS_CREATE
  ),
  assignCandidates
);

router.get(
  "/:assessmentId/assignments",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_VIEW,
    PERMISSIONS.ASSESSMENTS_VIEW
  ),
  getAssignments
);

router.delete(
  "/:assessmentId/assignments/:candidateId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE || PERMISSIONS.ASSESSMENTS_DELETE,
    PERMISSIONS.ASSESSMENTS_UPDATE || PERMISSIONS.ASSESSMENTS_DELETE
  ),
  removeAssignment
);

// --- Sub-routes for Sections & Questions ---
router.use("/:assessmentId/sections", sectionsRouter);
router.use("/:assessmentId/questions", questionsRouter);

export default router;
