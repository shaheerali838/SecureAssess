import express from "express";
import {
  createAssignments,
  createGroupAssignment,
  getAssignments,
  getAssignmentById,
  revokeAssignment,
  getMyAssignments,
  getMyAssessment,
} from "./assessmentAssignment.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Assessment Assignment Endpoints (nested under /assessments) ---
// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/assignments
router.post(
  "/assessments/:assessmentId/assignments",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_CREATE
  ),
  createAssignments
);

// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/assignments/group
router.post(
  "/assessments/:assessmentId/assignments/group",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_CREATE
  ),
  createGroupAssignment
);

// GET /api/v1/organizations/:organizationId/assessments/:assessmentId/assignments
router.get(
  "/assessments/:assessmentId/assignments",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_VIEW,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_VIEW
  ),
  getAssignments
);

// --- Direct Assignment Management Endpoints ---
// GET /api/v1/organizations/:organizationId/assessment-assignments/:assignmentId
router.get(
  "/assessment-assignments/:assignmentId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_VIEW,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_VIEW
  ),
  getAssignmentById
);

// PATCH /api/v1/organizations/:organizationId/assessment-assignments/:assignmentId/revoke
router.patch(
  "/assessment-assignments/:assignmentId/revoke",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_UPDATE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_UPDATE
  ),
  revokeAssignment
);

// --- Candidate Self Assessment Endpoints ---
// GET /api/v1/organizations/:organizationId/candidate-portal/assignments
router.get(
  "/candidate-portal/assignments",
  requireAuth,
  requireTenantContext,
  getMyAssignments
);

// GET /api/v1/organizations/:organizationId/candidate-portal/assessments/:assessmentId
router.get(
  "/candidate-portal/assessments/:assessmentId",
  requireAuth,
  requireTenantContext,
  getMyAssessment
);

export default router;
