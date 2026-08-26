import { AuthService } from "./auth.service.js";
import { AuthValidator } from "./auth.validator.js";
import { AUTH_MESSAGES } from "./auth.constants.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateRegister(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { name, email, password, role, organizationId } = req.body;
  const user = await AuthService.register({
    name,
    email,
    password,
    role,
    organizationId,
  });

  return res.status(201).json(new ApiResponse(201, user, AUTH_MESSAGES.REGISTER_SUCCESS));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateLogin(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { email, password, role } = req.body;
  const result = await AuthService.login({ email, password, role });

  return res.status(200).json(new ApiResponse(200, result, AUTH_MESSAGES.LOGIN_SUCCESS));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateRefreshToken(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const result = await AuthService.refresh(req.body.refreshToken);
  return res.status(200).json(new ApiResponse(200, result, AUTH_MESSAGES.TOKEN_REFRESHED));
});
