import express from "express";
import {
  createOrganization,
  listOrganizations,
  getOrganizationById,
  updateOrganization,
  updateOrganizationStatus,
  suspendOrganization,
  activateOrganization,
  deleteOrganization,
  inviteStaffMember,
  switchOrganization,
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
import questionBankRouter, { questionRouter } from "../questionBank/index.js";
import questionTagsRouter from "../questionTags/index.js";
import questionCategoriesRouter from "../questionCategories/index.js";
import assessmentsRouter from "../assessments/index.js";
import candidatesRouter from "../candidates/index.js";
import candidateGroupsRouter from "../candidateGroups/index.js";
import assessmentAssignmentsRouter from "../assessmentAssignments/index.js";
import attemptsRouter from "../attempts/index.js";
import answersRouter from "../answers/index.js";
import evaluationsRouter from "../evaluations/index.js";
import proctoringRouter from "../proctoring/index.js";
import reportsRouter from "../reports/index.js";
import certificatesRouter from "../certificates/index.js";
import interviewsRouter from "../interviews/index.js";
import resultsRouter from "../results/index.js";
import notificationsRouter from "../notifications/index.js";
import subscriptionsRouter from "../subscriptions/index.js";
import auditLogRoutes from "../auditLogs/auditLog.routes.js";
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

// GET /api/v1/organizations/:organizationId/settings - View organization settings
router.get(
  "/:organizationId/settings",
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

// PATCH /api/v1/organizations/:organizationId/settings - Update organization settings
router.patch(
  "/:organizationId/settings",
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

// POST /api/v1/organizations/:organizationId/suspend - Suspend organization (Platform only)
router.post(
  "/:organizationId/suspend",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.ORGANIZATIONS_SUSPEND),
  suspendOrganization
);

// POST /api/v1/organizations/:organizationId/activate - Activate organization (Platform only)
router.post(
  "/:organizationId/activate",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.ORGANIZATIONS_SUSPEND),
  activateOrganization
);

// POST /api/v1/organizations/:organizationId/switch - Switch organization context
router.post(
  "/:organizationId/switch",
  requireAuth,
  switchOrganization
);

// DELETE /api/v1/organizations/:organizationId - Soft delete / deactivate organization
router.delete("/:organizationId", requireAuth, deleteOrganization);

// --- Organization Member Management Endpoints ---

// POST /api/v1/organizations/:organizationId/members/invite - Invite staff member
router.post(
  "/:organizationId/members/invite",
  requireAuth,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ORG_USERS_CREATE,
    PERMISSIONS.ORG_USERS_CREATE
  ),
  inviteStaffMember
);

// POST /api/v1/organizations/:organizationId/invitations - Alias for invitation
router.post(
  "/:organizationId/invitations",
  requireAuth,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.ORG_USERS_CREATE,
    PERMISSIONS.ORG_USERS_CREATE
  ),
  inviteStaffMember
);

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

// --- Organization Question Banks, Questions & Question Tags Sub-routes ---
router.use("/:organizationId/question-tags", questionTagsRouter);
router.use("/:organizationId/question-categories", questionCategoriesRouter);
router.use("/:organizationId/question-banks", questionBankRouter);
router.use("/:organizationId/questions", questionRouter);

// --- Organization Assessments Sub-routes ---
router.use("/:organizationId/assessments", assessmentsRouter);

// --- Candidate & Assignment Sub-routes ---
router.use("/:organizationId/candidates", candidatesRouter);
router.use("/:organizationId/candidate-groups", candidateGroupsRouter);
router.use("/:organizationId", assessmentAssignmentsRouter);

// --- Attempt & Runtime Sub-routes ---
router.use("/:organizationId/candidate", attemptsRouter);
router.use("/:organizationId/candidate", answersRouter);

// --- Audit & Security Governance Sub-routes ---
router.use("/:organizationId/audit-logs", auditLogRoutes);

// --- Evaluation & Result Sub-routes ---
router.use("/:organizationId/evaluations", evaluationsRouter);
router.use("/:organizationId/results", resultsRouter);
router.use("/:organizationId", evaluationsRouter);
router.use("/:organizationId", resultsRouter);

// --- Proctoring Sub-routes ---
router.use("/:organizationId/proctoring", proctoringRouter);
router.use("/:organizationId", proctoringRouter);

// --- Reports & Analytics Sub-routes ---
router.use("/:organizationId/reports", reportsRouter);
router.use("/:organizationId", reportsRouter);

// --- Certificates & Credentials Sub-routes ---
router.use("/:organizationId/certificates", certificatesRouter);
router.use("/:organizationId", certificatesRouter);

// --- Live Interviews & WebRTC Sub-routes ---
router.use("/:organizationId/interviews", interviewsRouter);
router.use("/:organizationId", interviewsRouter);

// --- Notifications Sub-routes ---
router.use("/:organizationId/notifications", notificationsRouter);
router.use("/:organizationId", notificationsRouter);

// --- Subscriptions & Billing Sub-routes ---
router.use("/:organizationId/subscriptions", subscriptionsRouter);
router.use("/:organizationId/subscription", subscriptionsRouter);

export default router;
