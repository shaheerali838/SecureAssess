import express from "express";
import {
  createCandidate,
  getCandidates,
  getCandidate,
  updateCandidate,
  updateCandidateStatus,
  suspendCandidate,
  activateCandidate,
  deleteCandidate,
  inviteCandidate,
  activateCandidateAccount,
  bulkImportCandidates,
  getCandidatePortalProfile,
  updateCandidatePortalProfile,
  getCandidatePortalAssignments,
  getCandidatePortalAssignmentById,
  getCandidatePortalAttempts,
  getCandidatePortalResults,
  getCandidatePortalCertificates,
  getCandidatePortalInterviews,
} from "./candidate.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// ==========================================
// CANDIDATE PORTAL SELF-SERVICE ROUTES
// ==========================================

router.get("/portal/profile", requireAuth, getCandidatePortalProfile);
router.get("/profile", requireAuth, getCandidatePortalProfile);

router.patch("/portal/profile", requireAuth, updateCandidatePortalProfile);
router.patch("/profile", requireAuth, updateCandidatePortalProfile);

router.get("/portal/assignments", requireAuth, getCandidatePortalAssignments);
router.get("/assignments", requireAuth, getCandidatePortalAssignments);

router.get("/portal/assignments/:id", requireAuth, getCandidatePortalAssignmentById);
router.get("/assignments/:id", requireAuth, getCandidatePortalAssignmentById);

router.get("/portal/attempts", requireAuth, getCandidatePortalAttempts);
router.get("/attempts", requireAuth, getCandidatePortalAttempts);

router.get("/portal/results", requireAuth, getCandidatePortalResults);
router.get("/results", requireAuth, getCandidatePortalResults);

router.get("/portal/certificates", requireAuth, getCandidatePortalCertificates);
router.get("/certificates", requireAuth, getCandidatePortalCertificates);

router.get("/portal/interviews", requireAuth, getCandidatePortalInterviews);
router.get("/interviews", requireAuth, getCandidatePortalInterviews);

router.post("/portal/activate", activateCandidateAccount);
router.post("/activate", activateCandidateAccount);

// ==========================================
// ORGANIZATION CANDIDATE MANAGEMENT ROUTES
// ==========================================

// POST /api/v1/organizations/:organizationId/candidates
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_CREATE
  ),
  createCandidate
);

// POST /api/v1/organizations/:organizationId/candidates/import
router.post(
  "/import",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_CREATE
  ),
  bulkImportCandidates
);

// GET /api/v1/organizations/:organizationId/candidates
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_VIEW
  ),
  getCandidates
);

// GET /api/v1/organizations/:organizationId/candidates/:candidateId
router.get(
  "/:candidateId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_VIEW
  ),
  getCandidate
);

// PATCH /api/v1/organizations/:organizationId/candidates/:candidateId
router.patch(
  "/:candidateId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_UPDATE,
    PERMISSIONS.CANDIDATES_UPDATE
  ),
  updateCandidate
);

// POST /api/v1/organizations/:organizationId/candidates/:candidateId/invite
router.post(
  "/:candidateId/invite",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_UPDATE,
    PERMISSIONS.CANDIDATES_UPDATE
  ),
  inviteCandidate
);

// POST /api/v1/organizations/:organizationId/candidates/:candidateId/suspend
router.post(
  "/:candidateId/suspend",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_UPDATE,
    PERMISSIONS.CANDIDATES_UPDATE
  ),
  suspendCandidate
);

// POST /api/v1/organizations/:organizationId/candidates/:candidateId/activate
router.post(
  "/:candidateId/activate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_UPDATE,
    PERMISSIONS.CANDIDATES_UPDATE
  ),
  activateCandidate
);

// PATCH /api/v1/organizations/:organizationId/candidates/:candidateId/status
router.patch(
  "/:candidateId/status",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_UPDATE,
    PERMISSIONS.CANDIDATES_UPDATE
  ),
  updateCandidateStatus
);

// DELETE /api/v1/organizations/:organizationId/candidates/:candidateId
router.delete(
  "/:candidateId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CANDIDATES_DELETE,
    PERMISSIONS.CANDIDATES_DELETE
  ),
  deleteCandidate
);

export default router;
