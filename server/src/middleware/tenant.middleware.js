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

    let rawOrgId =
      req.params.organizationId ||
      req.headers["x-organization-id"] ||
      req.headers["x-tenant-id"] ||
      req.query?.organizationId ||
      req.user?.activeOrganizationId ||
      req.user?.organizationId ||
      null;

    const isPlatformStaff =
      req.user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      req.user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
      req.user.platformRole === "PLATFORM_OWNER" ||
      req.user.platformRole === "PLATFORM_ADMIN";

    // 1. If no organization ID context was passed:
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

      // Auto-fallback: Resolve user's active membership organization
      const autoMembership = await UserMembership.findOne({
        userId: req.user.id || req.user._id,
        status: "ACTIVE",
      })
        .populate("organizationId")
        .populate({
          path: "roleId",
          populate: { path: "permissions" },
        });

      if (autoMembership && autoMembership.organizationId) {
        req.organization = autoMembership.organizationId;
        req.organizationId = autoMembership.organizationId._id;
        req.tenantId = autoMembership.organizationId._id;
        req.membership = autoMembership;
        req.organizationRole = autoMembership.roleId;
        return next();
      }

      return next(new ApiError(400, "Organization ID context is required"));
    }

    // 2. Find Organization by ObjectId, slug, or code
    let organization = null;
    if (mongoose.Types.ObjectId.isValid(rawOrgId)) {
      organization = await Organization.findById(rawOrgId);
    } else {
      organization = await Organization.findOne({
        $or: [{ slug: rawOrgId }, { code: String(rawOrgId).toUpperCase() }],
      });
    }

    // If org was not found by ID/slug (e.g. stale dummy id stored in client), fallback to user's real membership org
    if (!organization) {
      if (!isPlatformStaff) {
        const fallbackMembership = await UserMembership.findOne({
          userId: req.user.id || req.user._id,
          status: "ACTIVE",
        })
          .populate("organizationId")
          .populate({
            path: "roleId",
            populate: { path: "permissions" },
          });

        if (fallbackMembership && fallbackMembership.organizationId) {
          req.organization = fallbackMembership.organizationId;
          req.organizationId = fallbackMembership.organizationId._id;
          req.tenantId = fallbackMembership.organizationId._id;
          req.membership = fallbackMembership;
          req.organizationRole = fallbackMembership.roleId;
          return next();
        }
      }

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

    // 3. Resolve tenant membership
    let membership = await UserMembership.findOne({
      userId: req.user.id || req.user._id,
      organizationId: organization._id,
      status: "ACTIVE",
    }).populate({
      path: "roleId",
      populate: { path: "permissions" },
    });

    // If membership not found in target org (e.g. user switched accounts), check user's actual active org
    if (!membership) {
      const activeMembership = await UserMembership.findOne({
        userId: req.user.id || req.user._id,
        status: "ACTIVE",
      })
        .populate("organizationId")
        .populate({
          path: "roleId",
          populate: { path: "permissions" },
        });

      if (activeMembership && activeMembership.organizationId) {
        req.organization = activeMembership.organizationId;
        req.organizationId = activeMembership.organizationId._id;
        req.tenantId = activeMembership.organizationId._id;
        req.membership = activeMembership;
        req.organizationRole = activeMembership.roleId;
        return next();
      }

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
