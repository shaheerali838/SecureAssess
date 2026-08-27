import express from "express";
import {
  createSection,
  getSections,
  updateSection,
  deleteSection,
} from "./assessmentSection.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/assessments/:assessmentId/sections
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_SECTIONS_CREATE,
    PERMISSIONS.ASSESSMENT_SECTIONS_CREATE
  ),
  createSection
);

// GET /api/v1/organizations/:organizationId/assessments/:assessmentId/sections
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_SECTIONS_VIEW,
    PERMISSIONS.ASSESSMENT_SECTIONS_VIEW
  ),
  getSections
);

// PATCH /api/v1/organizations/:organizationId/assessments/:assessmentId/sections/:sectionId
router.patch(
  "/:sectionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_SECTIONS_UPDATE,
    PERMISSIONS.ASSESSMENT_SECTIONS_UPDATE
  ),
  updateSection
);

// DELETE /api/v1/organizations/:organizationId/assessments/:assessmentId/sections/:sectionId
router.delete(
  "/:sectionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENT_SECTIONS_DELETE,
    PERMISSIONS.ASSESSMENT_SECTIONS_DELETE
  ),
  deleteSection
);

export default router;
