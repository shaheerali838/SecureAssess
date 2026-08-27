import { UserMembershipService } from "./userMembership.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * POST /api/v1/users/:userId/memberships - Create organization membership
 */
export const createMembership = asyncHandler(async (req, res) => {
  const { organizationId, roleId, status } = req.body;
  const targetUserId = req.params.userId;

  if (!organizationId || !roleId) {
    throw new ApiError(400, "organizationId and roleId are required");
  }

  const membership = await UserMembershipService.createMembership(
    {
      userId: targetUserId,
      organizationId,
      roleId,
      status,
    },
    req.user
  );

  return res
    .status(201)
    .json(new ApiResponse(201, membership, "Organization membership created successfully"));
});

/**
 * GET /api/v1/users/me/memberships - Get all active memberships of the logged-in user
 */
export const getMyMemberships = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const memberships = await UserMembershipService.getMyMemberships(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, memberships, "User memberships retrieved successfully"));
});

/**
 * GET /api/v1/organizations/:organizationId/members - Get all members belonging to an organization
 */
export const getOrganizationMembers = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const result = await UserMembershipService.getOrganizationMembers(
    organizationId,
    req.user,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Organization members retrieved successfully"));
});

/**
 * GET /api/v1/organizations/:organizationId/members/:membershipId - Get single member details
 */
export const getMembership = asyncHandler(async (req, res) => {
  const { organizationId, membershipId } = req.params;
  const membership = await UserMembershipService.getMembership(
    organizationId,
    membershipId,
    req.user
  );

  return res
    .status(200)
    .json(new ApiResponse(200, membership, "Membership retrieved successfully"));
});

/**
 * PATCH /api/v1/organizations/:organizationId/members/:membershipId/role - Update member role
 */
export const updateMembershipRole = asyncHandler(async (req, res) => {
  const { organizationId, membershipId } = req.params;
  const { roleId } = req.body;

  if (!roleId) {
    throw new ApiError(400, "roleId is required");
  }

  const updated = await UserMembershipService.updateMembershipRole(
    organizationId,
    membershipId,
    roleId,
    req.user
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Membership role updated successfully"));
});

/**
 * PATCH /api/v1/organizations/:organizationId/members/:membershipId/status - Update member status
 */
export const updateMembershipStatus = asyncHandler(async (req, res) => {
  const { organizationId, membershipId } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, "status is required");
  }

  const updated = await UserMembershipService.updateMembershipStatus(
    organizationId,
    membershipId,
    status,
    req.user
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updated, `Membership status updated to '${status}'`));
});

/**
 * DELETE /api/v1/organizations/:organizationId/members/:membershipId - Remove member
 */
export const removeMembership = asyncHandler(async (req, res) => {
  const { organizationId, membershipId } = req.params;
  const result = await UserMembershipService.removeMembership(
    organizationId,
    membershipId,
    req.user
  );

  return res.status(200).json(new ApiResponse(200, result, "Membership removed successfully"));
});
