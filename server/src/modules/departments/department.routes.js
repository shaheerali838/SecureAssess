import express from "express";
import {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
} from "./department.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/departments
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.DEPARTMENTS_CREATE,
    PERMISSIONS.DEPARTMENTS_CREATE
  ),
  createDepartment
);

// GET /api/v1/organizations/:organizationId/departments
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.DEPARTMENTS_VIEW
  ),
  getDepartments
);

// GET /api/v1/organizations/:organizationId/departments/:departmentId
router.get(
  "/:departmentId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.DEPARTMENTS_VIEW
  ),
  getDepartment
);

// PATCH /api/v1/organizations/:organizationId/departments/:departmentId
router.patch(
  "/:departmentId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.DEPARTMENTS_UPDATE,
    PERMISSIONS.DEPARTMENTS_UPDATE
  ),
  updateDepartment
);

// PATCH /api/v1/organizations/:organizationId/departments/:departmentId/status
router.patch(
  "/:departmentId/status",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.DEPARTMENTS_UPDATE,
    PERMISSIONS.DEPARTMENTS_UPDATE
  ),
  updateDepartmentStatus
);

// DELETE /api/v1/organizations/:organizationId/departments/:departmentId
router.delete(
  "/:departmentId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.DEPARTMENTS_DELETE,
    PERMISSIONS.DEPARTMENTS_DELETE
  ),
  deleteDepartment
);

export default router;
