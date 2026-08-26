import mongoose from "mongoose";
import { ApiError } from "./ApiError.js";

/**
 * Mongoose Schema definition helper for organization-owned resources.
 */
export const organizationField = {
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: [true, "Resource must belong to an organization (organizationId is required)"],
    index: true,
  },
};

/**
 * Filter helper ensuring queries never bleed across organizations.
 *
 * @param {Object} req Express request object containing req.organizationId
 * @param {Object} [filter={}] Additional query filter
 * @returns {Object} Scoped filter with organizationId attached
 */
export const getTenantFilter = (req, filter = {}) => {
  // Super Admin can optionally view cross-organization or target a specific org
  if (req.user?.role === "SUPER_ADMIN") {
    if (req.organizationId) {
      return { ...filter, organizationId: req.organizationId };
    }
    return filter;
  }

  if (!req.organizationId) {
    throw new ApiError(400, "Multi-tenant context missing: organizationId required");
  }

  return {
    ...filter,
    organizationId: req.organizationId,
  };
};
