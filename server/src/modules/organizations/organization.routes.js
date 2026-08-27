import express from "express";
import {
  createOrganization,
  listOrganizations,
  getOrganizationById,
  updateOrganization,
  updateOrganizationStatus,
  deleteOrganization,
} from "./organization.controller.js";
import {
  getOrganizationMembers,
  getMembership,
  updateMembershipRole,
  updateMembershipStatus,
  removeMembership,
} from "../users/userMembership.controller.js";
import departmentsRouter from "../departments/index.js";
import programsRouter from "../programs/index.js";
import subjectsRouter from "../subjects/index.js";
import questionBankRouter from "../questionBank/index.js";
import questionTagsRouter from "../questionTags/index.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  requirePlatformPermission,
  requireOrganizationOrPlatformPermission,
} from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router();

// --- Organization Resource Endpoints ---

// POST /api/v1/organizations - Create a new organization and assign initial owner (Platform only)
router.post(
  "/",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.ORGANIZATIONS_CREATE),
  createOrganization
);

// GET /api/v1/organizations - List organizations (Platform lists all, Tenant user lists member orgs)
router.get("/", requireAuth, listOrganizations);

// GET /api/v1/organizations/:organizationId - View single organization
router.get(
  "/:organizationId",
  requireAuth,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ORGANIZATIONS_VIEW,
    PERMISSIONS.ORG_PROFILE_VIEW
  ),
  getOrganizationById
);

// PATCH /api/v1/organizations/:organizationId - Update organization details
router.patch(
  "/:organizationId",
  requireAuth,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ORGANIZATIONS_UPDATE,
    PERMISSIONS.ORG_PROFILE_UPDATE
  ),
  updateOrganization
);

// PATCH /api/v1/organizations/:organizationId/status - Update organization lifecycle status (Platform only)
router.patch(
  "/:organizationId/status",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.ORGANIZATIONS_SUSPEND),
  updateOrganizationStatus
);

// DELETE /api/v1/organizations/:organizationId - Soft delete / deactivate organization
router.delete("/:organizationId", requireAuth, deleteOrganization);

// --- Organization Member Management Endpoints ---

// GET /api/v1/organizations/:organizationId/members - Get all members of organization
router.get("/:organizationId/members", requireAuth, getOrganizationMembers);

// GET /api/v1/organizations/:organizationId/members/:membershipId - Get single member
router.get("/:organizationId/members/:membershipId", requireAuth, getMembership);

// PATCH /api/v1/organizations/:organizationId/members/:membershipId/role - Update member role
router.patch("/:organizationId/members/:membershipId/role", requireAuth, updateMembershipRole);

// PATCH /api/v1/organizations/:organizationId/members/:membershipId/status - Update member status
router.patch("/:organizationId/members/:membershipId/status", requireAuth, updateMembershipStatus);

// DELETE /api/v1/organizations/:organizationId/members/:membershipId - Remove member
router.delete("/:organizationId/members/:membershipId", requireAuth, removeMembership);

// --- Organization Academic / Structure Sub-routes ---
router.use("/:organizationId/departments", departmentsRouter);
router.use("/:organizationId/programs", programsRouter);
router.use("/:organizationId/subjects", subjectsRouter);

// --- Organization Question Banks & Question Tags Sub-routes ---
router.use("/:organizationId/question-banks", questionBankRouter);
router.use("/:organizationId/question-tags", questionTagsRouter);

export default router;
