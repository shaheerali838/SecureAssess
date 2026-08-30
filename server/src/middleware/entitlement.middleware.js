import { EntitlementService } from "../services/billing/entitlement.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enforces that an organization's subscription plan includes a specific feature
 */
export const requireFeature = (featureKey) => {
  return asyncHandler(async (req, res, next) => {
    const organizationId =
      req.params.organizationId ||
      req.organizationId ||
      req.body.organizationId ||
      req.headers["x-organization-id"];

    if (!organizationId) {
      return next();
    }

    await EntitlementService.checkFeatureEntitlement(organizationId, featureKey);
    next();
  });
};

/**
 * Enforces that an organization has not reached its quota for a specific resource
 */
export const requireQuota = (resourceKey) => {
  return asyncHandler(async (req, res, next) => {
    const organizationId =
      req.params.organizationId ||
      req.organizationId ||
      req.body.organizationId ||
      req.headers["x-organization-id"];

    if (!organizationId) {
      return next();
    }

    await EntitlementService.checkUsageLimit(organizationId, resourceKey);
    next();
  });
};
