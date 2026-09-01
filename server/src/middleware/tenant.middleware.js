import mongoose from "mongoose";
import Organization from "../modules/organizations/organization.model.js";
import UserMembership from "../modules/users/userMembership.model.js";
import { PLATFORM_ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";
import { AuditLogService } from "../modules/auditLogs/auditLog.service.js";

/**
 * Passive global tenant resolver (does not block requests)
 */
export const tenantMiddleware = (req, res, next) => {
  const headerOrg =
    req.headers["x-organization-id"] ||
    req.headers["x-tenant-id"] ||
    null;

  if (headerOrg && mongoose.Types.ObjectId.isValid(headerOrg)) {
    req.organizationId = headerOrg;
    req.tenantId = headerOrg;
  }

  next();
};

/**
 * Strict Tenant Boundary Guard: Resolves organization tenant boundary and enforces isolation
 */
export const requireTenantContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ApiError(401, "Authentication token required"));
    }

    const rawOrgId =
      req.params.organizationId ||
      req.headers["x-organization-id"] ||
      req.headers["x-tenant-id"] ||
      req.query?.organizationId ||
      req.user?.activeOrganizationId ||
      req.user?.organizationId ||
      null;

    const isPlatformStaff =
      req.user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      req.user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN;

    if (!rawOrgId) {
      if (isPlatformStaff) {
        req.organization = null;
        req.organizationId = null;
        req.tenantId = null;
        req.organizationRole = {
          name: req.user.platformRole,
          scope: "PLATFORM",
          permissions: [],
        };
        return next();
      }
      return next(new ApiError(400, "Organization ID context is required"));
    }

    if (!mongoose.Types.ObjectId.isValid(rawOrgId)) {
      return next(new ApiError(400, "Invalid organization ID format"));
    }

    const organization = await Organization.findById(rawOrgId);
    if (!organization) {
      return next(new ApiError(404, "Organization not found"));
    }

    if (isPlatformStaff) {
      req.organization = organization;
      req.organizationId = organization._id;
      req.tenantId = organization._id;
      req.organizationRole = {
        name: req.user.platformRole,
        scope: "PLATFORM",
        permissions: [],
      };
      return next();
    }

    // Check organization lifecycle status
    if (organization.status === "DEACTIVATED") {
      return next(new ApiError(403, "This organization has been deactivated. Access denied."));
    }
    if (organization.status === "SUSPENDED") {
      return next(new ApiError(403, "This organization is suspended. Access denied."));
    }

    // Resolve tenant membership
    const membership = await UserMembership.findOne({
      userId: req.user.id || req.user._id,
      organizationId: organization._id,
      status: "ACTIVE",
    }).populate({
      path: "roleId",
      populate: { path: "permissions" },
    });

    if (!membership) {
      AuditLogService.createSecurityAuditLog({
        organizationId: organization._id,
        actorId: req.user.id || req.user._id,
        action: "TENANT_ACCESS_DENIED",
        resource: "ORGANIZATION",
        resourceId: organization._id,
        description: "User attempted cross-tenant access to organization without active membership",
        metadata: { path: req.originalUrl, method: req.method, targetOrgId: organization._id },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers["user-agent"],
        requestId: req.requestId,
        status: "DENIED",
        errorCode: "ERR_CROSS_TENANT_ACCESS",
      }).catch(() => {});

      return next(
        new ApiError(
          403,
          "Forbidden. You do not hold an active membership in this organization."
        )
      );
    }

    req.organization = organization;
    req.organizationId = organization._id;
    req.tenantId = organization._id;
    req.membership = membership;
    req.organizationRole = membership.roleId;

    // Defense-in-depth: If client attempts to send spoofed organizationId in body, sanitize it
    if (req.body && typeof req.body === "object") {
      req.body.organizationId = organization._id;
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const requireTenant = requireTenantContext;
