import express from "express";
import {
  createSection,
  getSections,
  updateSection,
  deleteSection,
  reorderSections,
} from "./assessmentSection.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

router.patch(
  "/reorder",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_UPDATE
  ),
  reorderSections
);

router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_UPDATE
  ),
  createSection
);

router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_VIEW,
    PERMISSIONS.ASSESSMENTS_VIEW
  ),
  getSections
);

router.patch(
  "/:sectionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_UPDATE
  ),
  updateSection
);

router.delete(
  "/:sectionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_UPDATE
  ),
  deleteSection
);

export default router;
