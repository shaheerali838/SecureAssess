import express from "express";
import {
  createCandidate,
  getCandidates,
  getCandidate,
  updateCandidate,
  updateCandidateStatus,
  deleteCandidate,
} from "./candidate.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

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
