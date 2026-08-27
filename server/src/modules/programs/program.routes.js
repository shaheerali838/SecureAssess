import express from "express";
import {
  createProgram,
  getPrograms,
  getProgram,
  updateProgram,
  updateProgramStatus,
  deleteProgram,
} from "./program.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/programs
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROGRAMS_CREATE,
    PERMISSIONS.PROGRAMS_CREATE
  ),
  createProgram
);

// GET /api/v1/organizations/:organizationId/programs
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROGRAMS_VIEW,
    PERMISSIONS.PROGRAMS_VIEW
  ),
  getPrograms
);

// GET /api/v1/organizations/:organizationId/programs/:programId
router.get(
  "/:programId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROGRAMS_VIEW,
    PERMISSIONS.PROGRAMS_VIEW
  ),
  getProgram
);

// PATCH /api/v1/organizations/:organizationId/programs/:programId
router.patch(
  "/:programId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROGRAMS_UPDATE,
    PERMISSIONS.PROGRAMS_UPDATE
  ),
  updateProgram
);

// PATCH /api/v1/organizations/:organizationId/programs/:programId/status
router.patch(
  "/:programId/status",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROGRAMS_UPDATE,
    PERMISSIONS.PROGRAMS_UPDATE
  ),
  updateProgramStatus
);

// DELETE /api/v1/organizations/:organizationId/programs/:programId
router.delete(
  "/:programId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROGRAMS_DELETE,
    PERMISSIONS.PROGRAMS_DELETE
  ),
  deleteProgram
);

export default router;
