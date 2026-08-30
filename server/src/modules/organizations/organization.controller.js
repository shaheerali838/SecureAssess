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
  const organizationId = req.params.organizationId || req.organizationId;
  const organization = await OrganizationService.getOrganizationById(
    organizationId,
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
  const organizationId = req.params.organizationId || req.organizationId;
  const { isValid, errors } = OrganizationValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organization = await OrganizationService.updateOrganization(
    organizationId,
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
  const organizationId = req.params.organizationId || req.organizationId;
  const { isValid, errors } = OrganizationValidator.validateStatusUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organization = await OrganizationService.updateOrganizationStatus(
    organizationId,
    req.body.status,
    req.user
  );

  return res
    .status(200)
    .json(new ApiResponse(200, organization, `Organization status updated to '${req.body.status}'`));
});

/**
 * POST /api/v1/organizations/:organizationId/suspend - Suspend organization
 */
export const suspendOrganization = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const organization = await OrganizationService.updateOrganizationStatus(
    organizationId,
    "SUSPENDED",
    req.user
  );
  return res.status(200).json(new ApiResponse(200, organization, "Organization suspended successfully"));
});

/**
 * POST /api/v1/organizations/:organizationId/activate - Activate organization
 */
export const activateOrganization = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const organization = await OrganizationService.updateOrganizationStatus(
    organizationId,
    "ACTIVE",
    req.user
  );
  return res.status(200).json(new ApiResponse(200, organization, "Organization activated successfully"));
});

/**
 * DELETE /api/v1/organizations/:organizationId - Soft delete / deactivate organization
 */
export const deleteOrganization = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const result = await OrganizationService.deleteOrganization(
    organizationId,
    req.user
  );

  return res.status(200).json(new ApiResponse(200, result, "Organization deactivated successfully"));
});

/**
 * POST /api/v1/organizations/:organizationId/members/invite - Invite staff member
 */
export const inviteStaffMember = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const inviterUserId = req.user?.id || req.user?._id;
  const result = await OrganizationService.inviteStaffMember(
    organizationId,
    req.body,
    inviterUserId
  );
  return res.status(201).json(new ApiResponse(201, result, "Staff invitation sent successfully"));
});

/**
 * GET /api/v1/organizations/:organizationId/members - List members
 */
export const listMembers = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const result = await OrganizationService.listMembers(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Members retrieved successfully"));
});

/**
 * PATCH /api/v1/organizations/:organizationId/members/:membershipId - Update member
 */
export const updateMember = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { membershipId } = req.params;
  const actorUserId = req.user?.id || req.user?._id;
  const result = await OrganizationService.updateMember(
    organizationId,
    membershipId,
    req.body,
    actorUserId
  );
  return res.status(200).json(new ApiResponse(200, result, "Member updated successfully"));
});

/**
 * DELETE /api/v1/organizations/:organizationId/members/:membershipId - Remove member
 */
export const removeMember = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { membershipId } = req.params;
  const actorUserId = req.user?.id || req.user?._id;
  const result = await OrganizationService.removeMember(
    organizationId,
    membershipId,
    actorUserId
  );
  return res.status(200).json(new ApiResponse(200, result, "Member removed successfully"));
});

/**
 * POST /api/v1/organizations/:organizationId/switch - Switch organization context
 */
export const switchOrganization = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await OrganizationService.switchOrganization(organizationId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Organization context switched successfully"));
});
