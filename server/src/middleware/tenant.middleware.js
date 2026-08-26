import { ApiError } from "../utils/ApiError.js";

/**
 * Global Tenant Resolver Middleware:
 * Extracts organizationId securely from the cryptographically verified JWT (req.user).
 *
 * Security Rule:
 * Never trust organizationId sent in req.query, req.body, or headers for tenant users.
 * Only Platform SUPER_ADMINs can specify an organization via header for platform management.
 */
export const tenantMiddleware = (req, res, next) => {
  if (req.user) {
    if (req.user.role === "SUPER_ADMIN") {
      // Super Admin can optionally target a specific tenant via header or query
      const targetOrg =
        req.headers["x-tenant-id"] ||
        req.headers["x-organization-id"] ||
        req.query.organizationId ||
        null;
      req.organizationId = targetOrg;
      req.tenantId = targetOrg;
    } else {
      // Normal tenant users (Admins, Recruiters, Examiners, Candidates) MUST ONLY use their verified JWT organizationId
      req.organizationId = req.user.organizationId || null;
      req.tenantId = req.user.organizationId || null;

      // Defense-in-depth: If client sent an organizationId in body/query that attempts to spoof another tenant, sanitize/override it
      if (req.body && typeof req.body === "object") {
        req.body.organizationId = req.organizationId;
      }
    }
  } else {
    // Unauthenticated requests (e.g. public branding lookups) can read explicit headers/slugs
    const headerOrg = req.headers["x-tenant-id"] || req.headers["x-organization-id"] || null;
    req.organizationId = headerOrg;
    req.tenantId = headerOrg;
  }

  next();
};

/**
 * Strict Multi-Tenancy Guard Middleware:
 * Blocks requests if organization context is missing for tenant-owned resources.
 */
export const requireTenant = (req, res, next) => {
  const isSuperAdmin = req.user?.role === "SUPER_ADMIN";

  if (!req.organizationId && !isSuperAdmin) {
    return next(
      new ApiError(
        403,
        "Tenant context required. You must belong to an active organization to perform this action."
      )
    );
  }

  next();
};
