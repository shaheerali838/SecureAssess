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

    // 1. PLATFORM_OWNER has root authority over all platform actions
    if (req.user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER) {
      return next();
    }

    // 2. Non-platform users are strictly blocked from platform operations
    if (req.user.platformRole !== PLATFORM_ROLES.PLATFORM_ADMIN) {
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
    }

    // 3. For PLATFORM_ADMIN, check explicit permissions assigned to the PLATFORM_ADMIN role
    try {
      const platformAdminRole = await Role.findOne({
        name: PLATFORM_ROLES.PLATFORM_ADMIN,
        scope: ROLE_SCOPES.PLATFORM,
      }).populate("permissions", "key");

      if (!platformAdminRole) {
        return next(new ApiError(403, "Forbidden. Platform Admin role configuration missing."));
      }

      const assignedKeys = platformAdminRole.permissions.map((p) => p.key);
      const hasAll = requiredPermissions.every((perm) => assignedKeys.includes(perm));

      if (!hasAll) {
        AuditLogService.createSecurityAuditLog({
          actorId: req.user.id || req.user._id,
          action: AUDIT_ACTIONS.PERMISSION_DENIED,
          resource: AUDIT_RESOURCES.PLATFORM,
          description: `Missing platform permissions: [${requiredPermissions.join(", ")}]`,
          metadata: { path: req.originalUrl, requiredPermissions, assignedKeys },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
          status: AUDIT_STATUSES.DENIED,
          errorCode: "ERR_MISSING_PLATFORM_PERMISSION",
        }).catch(() => {});

        return next(
          new ApiError(
            403,
            `Forbidden. Missing required platform permissions: [${requiredPermissions.join(", ")}]`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
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

    // 1. Root PLATFORM_OWNER always bypasses
    if (req.user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER) {
      return next();
    }

    // 2. Check PLATFORM_ADMIN with platform permission
    if (req.user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN) {
      const platformAdminRole = await Role.findOne({
        name: PLATFORM_ROLES.PLATFORM_ADMIN,
        scope: ROLE_SCOPES.PLATFORM,
      }).populate("permissions", "key");

      if (platformAdminRole) {
        const keys = platformAdminRole.permissions.map((p) => p.key);
        if (keys.includes(platformPerm)) {
          return next();
        }
      }
    }

    // 3. Organization Membership Context Check
    const targetOrgId =
      req.params.organizationId ||
      req.organizationId ||
      req.query?.organizationId ||
      req.headers["x-organization-id"] ||
      req.body?.organizationId;
    if (!targetOrgId) {
      return next(new ApiError(400, "Organization ID parameter is required"));
    }

    try {
      const membership = await UserMembership.findOne({
        userId: req.user.id || req.user._id,
        organizationId: targetOrgId,
        status: "ACTIVE",
      }).populate({
        path: "roleId",
        populate: { path: "permissions", select: "key" },
      });

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

      const role = membership.roleId;
      if (!role) {
        return next(new ApiError(403, "Forbidden. Membership role is missing or invalid."));
      }

      const userOrgPerms = (role.permissions || []).map((p) => p.key);
      if (orgPerm && !userOrgPerms.includes(orgPerm)) {
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
          errorCode: "ERR_MISSING_ORG_PERMISSION",
        }).catch(() => {});

        return next(
          new ApiError(403, `Forbidden. Missing required organization permission: '${orgPerm}'`)
        );
      }

      req.membership = membership;
      req.organizationId = targetOrgId;
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
