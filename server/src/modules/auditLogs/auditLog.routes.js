import express from "express";
import {
  getAuditLogs,
  getAuditLogById,
  getResourceAuditLogs,
  getUserAuditLogs,
  exportAuditLogs,
} from "./auditLog.controller.js";
import {
  queryAuditLogsSchema,
  exportAuditLogsSchema,
} from "./auditLog.validation.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// GET /api/v1/audit-logs/export
router.get(
  "/export",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.AUDIT_LOGS_EXPORT,
    PERMISSIONS.AUDIT_LOGS_EXPORT
  ),
  validateRequest(exportAuditLogsSchema, "query"),
  exportAuditLogs
);

// GET /api/v1/audit-logs/resource/:resource/:resourceId
router.get(
  "/resource/:resource/:resourceId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.AUDIT_LOGS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW
  ),
  getResourceAuditLogs
);

// GET /api/v1/audit-logs/user/:userId
router.get(
  "/user/:userId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.AUDIT_LOGS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW
  ),
  getUserAuditLogs
);

// GET /api/v1/audit-logs/:auditLogId
router.get(
  "/:auditLogId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.AUDIT_LOGS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW
  ),
  getAuditLogById
);

// GET /api/v1/audit-logs
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.AUDIT_LOGS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW
  ),
  validateRequest(queryAuditLogsSchema, "query"),
  getAuditLogs
);

export default router;
