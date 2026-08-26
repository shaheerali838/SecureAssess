import { UserService } from "./user.service.js";
import { UserValidator } from "./user.validator.js";
import { USER_MESSAGES } from "./user.constants.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, formatPaginatedResponse } from "../../utils/pagination.js";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.user.id);
  return res.status(200).json(new ApiResponse(200, user, USER_MESSAGES.PROFILE_RETRIEVED));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  return res.status(200).json(new ApiResponse(200, user, USER_MESSAGES.USER_RETRIEVED));
});

export const getOrgUsers = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const organizationId = req.organizationId || req.user.organizationId;
  const { items, total } = await UserService.getUsersByOrganization(
    organizationId,
    {},
    pagination
  );
  return res.status(200).json(
    new ApiResponse(
      200,
      formatPaginatedResponse({ data: items, total, page: pagination.page, limit: pagination.limit }),
      USER_MESSAGES.USERS_RETRIEVED
    )
  );
});

export const updateUser = asyncHandler(async (req, res) => {
  const { isValid, errors } = UserValidator.validateUpdateUser(req.body);
  if (!isValid) throw new ApiError(400, "Validation failed", errors);

  const updated = await UserService.updateUser(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, updated, USER_MESSAGES.USER_UPDATED));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await UserService.deleteUser(req.params.id);
  return res.status(200).json(new ApiResponse(200, result, USER_MESSAGES.USER_DELETED));
});
