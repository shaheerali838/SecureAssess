import express from "express";
import {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  updateSubjectStatus,
  deleteSubject,
} from "./subject.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/subjects
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBJECTS_CREATE,
    PERMISSIONS.SUBJECTS_CREATE
  ),
  createSubject
);

// GET /api/v1/organizations/:organizationId/subjects
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBJECTS_VIEW,
    PERMISSIONS.SUBJECTS_VIEW
  ),
  getSubjects
);

// GET /api/v1/organizations/:organizationId/subjects/:subjectId
router.get(
  "/:subjectId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBJECTS_VIEW,
    PERMISSIONS.SUBJECTS_VIEW
  ),
  getSubject
);

// PATCH /api/v1/organizations/:organizationId/subjects/:subjectId
router.patch(
  "/:subjectId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBJECTS_UPDATE,
    PERMISSIONS.SUBJECTS_UPDATE
  ),
  updateSubject
);

// PATCH /api/v1/organizations/:organizationId/subjects/:subjectId/status
router.patch(
  "/:subjectId/status",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBJECTS_UPDATE,
    PERMISSIONS.SUBJECTS_UPDATE
  ),
  updateSubjectStatus
);

// DELETE /api/v1/organizations/:organizationId/subjects/:subjectId
router.delete(
  "/:subjectId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBJECTS_DELETE,
    PERMISSIONS.SUBJECTS_DELETE
  ),
  deleteSubject
);

export default router;
