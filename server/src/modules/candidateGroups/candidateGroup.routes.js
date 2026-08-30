import express from "express";
import {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  getGroupMembers,
} from "./candidateGroup.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/candidate-groups
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATE_GROUPS_CREATE,
    PERMISSIONS.CANDIDATE_GROUPS_CREATE
  ),
  createGroup
);

// GET /api/v1/organizations/:organizationId/candidate-groups
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATE_GROUPS_VIEW,
    PERMISSIONS.CANDIDATE_GROUPS_VIEW
  ),
  getGroups
);

// GET /api/v1/organizations/:organizationId/candidate-groups/:groupId
router.get(
  "/:groupId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATE_GROUPS_VIEW,
    PERMISSIONS.CANDIDATE_GROUPS_VIEW
  ),
  getGroup
);

// PATCH /api/v1/organizations/:organizationId/candidate-groups/:groupId
router.patch(
  "/:groupId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATE_GROUPS_UPDATE,
    PERMISSIONS.CANDIDATE_GROUPS_UPDATE
  ),
  updateGroup
);

// DELETE /api/v1/organizations/:organizationId/candidate-groups/:groupId
router.delete(
  "/:groupId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATE_GROUPS_DELETE,
    PERMISSIONS.CANDIDATE_GROUPS_DELETE
  ),
  deleteGroup
);

// POST /api/v1/organizations/:organizationId/candidate-groups/:groupId/members
router.post(
  "/:groupId/members",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATE_GROUPS_UPDATE,
    PERMISSIONS.CANDIDATE_GROUPS_UPDATE
  ),
  addMember
);

// GET /api/v1/organizations/:organizationId/candidate-groups/:groupId/members
router.get(
  "/:groupId/members",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATE_GROUPS_VIEW,
    PERMISSIONS.CANDIDATE_GROUPS_VIEW
  ),
  getGroupMembers
);

// DELETE /api/v1/organizations/:organizationId/candidate-groups/:groupId/members/:candidateId
router.delete(
  "/:groupId/members/:candidateId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATE_GROUPS_UPDATE,
    PERMISSIONS.CANDIDATE_GROUPS_UPDATE
  ),
  removeMember
);

export default router;
