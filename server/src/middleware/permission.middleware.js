import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { PLATFORM_ROLES, ROLE_SCOPES } from "../constants/roles.js";
import Role from "../modules/roles/role.model.js";
import Permission from "../modules/permissions/permission.model.js";
import UserMembership from "../modules/users/userMembership.model.js";
import { AuditLogService } from "../modules/auditLogs/auditLog.service.js";
import { AUDIT_ACTIONS, AUDIT_RESOURCES, AUDIT_STATUSES } from "../modules/auditLogs/auditLog.constants.js";

/**
 * Platform Authorization Guard:
 * Restricts access to Platform Owner or authorized Platform Admin with specific permissions.
 */
export const requirePlatformPermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    // 1. Root Platform Staff always bypasses
    if (
      req.user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      req.user.platformRole === "PLATFORM_OWNER" ||
      req.user.platformRole === "SUPER_ADMIN" ||
      req.user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
      req.user.platformRole === "PLATFORM_ADMIN" ||
      req.user.role === "PLATFORM_OWNER" ||
      req.user.role === "PLATFORM_ADMIN" ||
      req.user.role === "SUPER_ADMIN"
    ) {
      return next();
    }

    // 2. Non-platform users are strictly blocked from platform operations
    AuditLogService.createSecurityAuditLog({
      actorId: req.user.id || req.user._id,
      action: AUDIT_ACTIONS.PERMISSION_DENIED,
      resource: AUDIT_RESOURCES.PLATFORM,
      description: `Unauthorized attempt to access platform-scoped operation: ${req.originalUrl || req.url}`,
      metadata: { path: req.originalUrl || req.url, method: req.method },
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers["user-agent"],
      requestId: req.requestId,
      status: AUDIT_STATUSES.DENIED,
      errorCode: "ERR_PLATFORM_SCOPE_REQUIRED",
    }).catch(() => {});

    return next(
      new ApiError(
        403,
        "Forbidden. Platform administration scope required for this action."
      )
    );
  };
};

/**
 * Organization Authorization Guard:
 * Allows Platform Owner/Admin OR verified tenant members with the required permission within the target organization.
 */
export const requireOrganizationOrPlatformPermission = (platformPerm, orgPerm) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    // 1. Root Platform Staff always bypasses
    const isPlatformStaff =
      req.user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      req.user.platformRole === "PLATFORM_OWNER" ||
      req.user.platformRole === "SUPER_ADMIN" ||
      req.user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
      req.user.platformRole === "PLATFORM_ADMIN" ||
      req.user.role === "PLATFORM_OWNER" ||
      req.user.role === "PLATFORM_ADMIN" ||
      req.user.role === "SUPER_ADMIN";

    if (isPlatformStaff) {
      return next();
    }

    // 2. Organization Membership Context Check
    const targetOrgId =
      req.params.organizationId ||
      req.organizationId ||
      req.query?.organizationId ||
      req.headers["x-organization-id"] ||
      req.body?.organizationId;

    try {
      let membership = req.membership;

      if (!membership) {
        const userObjectId = mongoose.Types.ObjectId.isValid(req.user._id || req.user.id)
          ? new mongoose.Types.ObjectId(req.user._id || req.user.id)
          : (req.user._id || req.user.id);

        if (targetOrgId) {
          const orgObjectId = mongoose.Types.ObjectId.isValid(targetOrgId)
            ? new mongoose.Types.ObjectId(targetOrgId)
            : targetOrgId;

          membership = await UserMembership.findOne({
            userId: userObjectId,
            organizationId: orgObjectId,
            status: "ACTIVE",
          }).populate({
            path: "roleId",
            populate: { path: "permissions", select: "key" },
          });
        }

        // Fallback: Check if user has ANY active membership in any organization
        if (!membership) {
          membership = await UserMembership.findOne({
            userId: userObjectId,
            status: "ACTIVE",
          }).populate({
            path: "roleId",
            populate: { path: "permissions", select: "key" },
          });

          if (membership && membership.organizationId) {
            req.organizationId = membership.organizationId._id || membership.organizationId;
          }
        }
      }

      if (!membership) {
        AuditLogService.createSecurityAuditLog({
          organizationId: targetOrgId,
          actorId: req.user.id || req.user._id,
          action: AUDIT_ACTIONS.TENANT_ACCESS_DENIED,
          resource: AUDIT_RESOURCES.ORGANIZATION,
          resourceId: targetOrgId,
          description: `User attempted cross-tenant access to organization without active membership`,
          metadata: { targetOrgId, path: req.originalUrl, method: req.method },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
          status: AUDIT_STATUSES.DENIED,
          errorCode: "ERR_CROSS_TENANT_ACCESS",
        }).catch(() => {});

        return next(
          new ApiError(403, "Forbidden. You do not have an active membership in this organization.")
        );
      }

      let role = membership.roleId;
      if (role && !role.name && (mongoose.Types.ObjectId.isValid(role) || typeof role === "string")) {
        role = await Role.findById(role).populate("permissions", "key");
      }

      if (!role) {
        return next(new ApiError(403, "Forbidden. Membership role is missing or invalid."));
      }

      // Organization Owners and Organization Admins have full access to organization endpoints
      const roleName = (role.name || "").toUpperCase();
      if (
        roleName === "ORGANIZATION_OWNER" ||
        roleName === "ORGANIZATION_ADMIN" ||
        roleName === "ADMIN" ||
        roleName === "OWNER"
      ) {
        req.membership = membership;
        if (!req.organizationId) req.organizationId = targetOrgId;
        return next();
      }

      const userOrgPerms = (role.permissions || []).map((p) =>
        typeof p === "string" ? p : p.key || p.name || ""
      );

      // Check direct permission or alias (e.g. billing.view vs tenant_billing.view)
      const matchesPerm = (requiredPerm) => {
        if (!requiredPerm) return true;
        const stripped = requiredPerm.replace(/^tenant_/, "");
        return userOrgPerms.some(
          (p) => p === requiredPerm || p.replace(/^tenant_/, "") === stripped
        );
      };

      if (orgPerm && !matchesPerm(orgPerm)) {
        AuditLogService.createSecurityAuditLog({
          organizationId: targetOrgId,
          actorId: req.user.id || req.user._id,
          action: AUDIT_ACTIONS.PERMISSION_DENIED,
          resource: AUDIT_RESOURCES.ORGANIZATION,
          resourceId: targetOrgId,
          description: `User lacks required organization permission: '${orgPerm}'`,
          metadata: { targetOrgId, requiredPerm: orgPerm, path: req.originalUrl, method: req.method },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
          status: AUDIT_STATUSES.DENIED,
          errorCode: "ERR_INSUFFICIENT_PERMISSIONS",
        }).catch(() => {});

        return next(
          new ApiError(403, `Forbidden. Missing required organization permission: '${orgPerm}'`)
        );
      }

      req.membership = membership;
      if (!req.organizationId) req.organizationId = targetOrgId;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Generic Permission Middleware
 */
export const requirePermissions = requirePlatformPermission;
export { requirePermission } from "../config/rbac.config.js";
export default {
  requirePlatformPermission,
  requireOrganizationOrPlatformPermission,
  requirePermissions,
};

