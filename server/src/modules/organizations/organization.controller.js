import { OrganizationService } from "./organization.service.js";
import { OrganizationValidator } from "./organization.validator.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * POST /api/v1/organizations - Create organization and assign initial owner
 */
export const createOrganization = asyncHandler(async (req, res) => {
  const { isValid, errors } = OrganizationValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const creatorId = req.user?.id || req.user?._id || null;
  const organization = await OrganizationService.createOrganization(req.body, creatorId);

  return res
    .status(201)
    .json(new ApiResponse(201, organization, "Organization created successfully with owner assigned"));
});

/**
 * GET /api/v1/organizations - List organizations with tenant/platform scoping
 */
export const listOrganizations = asyncHandler(async (req, res) => {
  const result = await OrganizationService.listOrganizations(req.user, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Organizations retrieved successfully"));
});

/**
 * GET /api/v1/organizations/:organizationId - Get single organization by ID
 */
export const getOrganizationById = asyncHandler(async (req, res) => {
  const organization = await OrganizationService.getOrganizationById(
    req.params.organizationId,
    req.user
  );

  return res
    .status(200)
    .json(new ApiResponse(200, organization, "Organization retrieved successfully"));
});

/**
 * PATCH /api/v1/organizations/:organizationId - Update organization details
 */
export const updateOrganization = asyncHandler(async (req, res) => {
  const { isValid, errors } = OrganizationValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organization = await OrganizationService.updateOrganization(
    req.params.organizationId,
    req.body,
    req.user
  );

  return res
    .status(200)
    .json(new ApiResponse(200, organization, "Organization updated successfully"));
});

/**
 * PATCH /api/v1/organizations/:organizationId/status - Update organization lifecycle status
 */
export const updateOrganizationStatus = asyncHandler(async (req, res) => {
  const { isValid, errors } = OrganizationValidator.validateStatusUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organization = await OrganizationService.updateOrganizationStatus(
    req.params.organizationId,
    req.body.status,
    req.user
  );

  return res
    .status(200)
    .json(new ApiResponse(200, organization, `Organization status updated to '${req.body.status}'`));
});

/**
 * DELETE /api/v1/organizations/:organizationId - Soft delete / deactivate organization
 */
export const deleteOrganization = asyncHandler(async (req, res) => {
  const result = await OrganizationService.deleteOrganization(
    req.params.organizationId,
    req.user
  );

  return res.status(200).json(new ApiResponse(200, result, "Organization deactivated successfully"));
});
