import { UserService } from "./user.service.js";
import { UserValidator } from "./user.validator.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * GET /api/v1/users - List users
 */
export const listUsers = asyncHandler(async (req, res) => {
  const result = await UserService.listUsers(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Users retrieved successfully"));
});

/**
 * GET /api/v1/users/:userId - Get user profile and memberships
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.params.userId, req.user);
  return res.status(200).json(new ApiResponse(200, user, "User profile retrieved successfully"));
});

/**
 * PATCH /api/v1/users/:userId - Update user profile
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { isValid, errors } = UserValidator.validateUpdateUser(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const updatedUser = await UserService.updateUser(req.params.userId, req.body, req.user);
  return res.status(200).json(new ApiResponse(200, updatedUser, "User profile updated successfully"));
});

/**
 * PATCH /api/v1/users/:userId/status - Update universal user status (Platform Staff only)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isValid, errors } = UserValidator.validateStatusUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const updatedUser = await UserService.updateUserStatus(req.params.userId, req.body.status, req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, `User status updated to '${req.body.status}'`));
});

/**
 * POST /api/v1/users/:userId/memberships - Assign user to organization with a role
 */
export const createMembership = asyncHandler(async (req, res) => {
  const { isValid, errors } = UserValidator.validateCreateMembership(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const membership = await UserService.createMembership(req.params.userId, req.body, req.user);
  return res
    .status(201)
    .json(new ApiResponse(201, membership, "Organization membership created successfully"));
});

/**
 * GET /api/v1/users/:userId/memberships - List user memberships
 */
export const listMemberships = asyncHandler(async (req, res) => {
  const memberships = await UserService.listMemberships(req.params.userId, req.user);
  return res
    .status(200)
    .json(new ApiResponse(200, memberships, "User memberships retrieved successfully"));
});

/**
 * PATCH /api/v1/users/:userId/memberships/:membershipId - Update membership role or status
 */
export const updateMembership = asyncHandler(async (req, res) => {
  const { isValid, errors } = UserValidator.validateUpdateMembership(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const updated = await UserService.updateMembership(
    req.params.userId,
    req.params.membershipId,
    req.body,
    req.user
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Organization membership updated successfully"));
});

/**
 * DELETE /api/v1/users/:userId/memberships/:membershipId - Remove membership
 */
export const deleteMembership = asyncHandler(async (req, res) => {
  const result = await UserService.deleteMembership(
    req.params.userId,
    req.params.membershipId,
    req.user
  );
  return res.status(200).json(new ApiResponse(200, result, "Membership deleted successfully"));
});
