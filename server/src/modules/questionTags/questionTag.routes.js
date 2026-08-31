import express from "express";
import {
  createTag,
  getTags,
  getTag,
  updateTag,
  deleteTag,
} from "./questionTag.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/question-tags
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_TAGS_CREATE,
    PERMISSIONS.QUESTION_TAGS_CREATE
  ),
  createTag
);

// GET /api/v1/organizations/:organizationId/question-tags
// Any authenticated org member can list tags (low-sensitivity lookup)
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  getTags
);

// GET /api/v1/organizations/:organizationId/question-tags/:tagId
router.get(
  "/:tagId",
  requireAuth,
  requireTenantContext,
  getTag
);

// PATCH /api/v1/organizations/:organizationId/question-tags/:tagId
router.patch(
  "/:tagId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_TAGS_UPDATE,
    PERMISSIONS.QUESTION_TAGS_UPDATE
  ),
  updateTag
);

// DELETE /api/v1/organizations/:organizationId/question-tags/:tagId
router.delete(
  "/:tagId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.QUESTION_TAGS_DELETE,
    PERMISSIONS.QUESTION_TAGS_DELETE
  ),
  deleteTag
);

export default router;
