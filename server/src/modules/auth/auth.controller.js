import { AuthService } from "./auth.service.js";
import { AuthValidator } from "./auth.validator.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * POST /api/v1/auth/login - User login
 */
export const login = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateLogin(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.connection.remoteAddress || "";

  const result = await AuthService.login({
    email: req.body.email,
    password: req.body.password,
    userAgent,
    ipAddress,
  });

  return res.status(200).json(new ApiResponse(200, result, "Login successful"));
});

/**
 * POST /api/v1/auth/refresh-token - Rotate refresh token & issue new access token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateRefreshToken(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.connection.remoteAddress || "";

  const result = await AuthService.refreshToken({
    refreshToken: req.body.refreshToken,
    userAgent,
    ipAddress,
  });

  return res.status(200).json(new ApiResponse(200, result, "Token refreshed successfully"));
});

/**
 * POST /api/v1/auth/logout - Revoke current session
 */
export const logout = asyncHandler(async (req, res) => {
  const sessionId = req.user?.sessionId;
  const userId = req.user?.id || req.user?._id;

  const result = await AuthService.logout(sessionId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Logout successful"));
});

/**
 * POST /api/v1/auth/logout-all - Revoke all user sessions
 */
export const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await AuthService.logoutAll(userId);
  return res.status(200).json(new ApiResponse(200, result, "All sessions revoked successfully"));
});

/**
 * GET /api/v1/auth/me - Get current user profile and memberships
 */
export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await AuthService.getMe(userId);
  return res.status(200).json(new ApiResponse(200, result, "Current profile retrieved successfully"));
});

/**
 * POST /api/v1/auth/change-password - Change user password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateChangePassword(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const userId = req.user?.id || req.user?._id;
  const result = await AuthService.changePassword(userId, req.body);
  return res.status(200).json(new ApiResponse(200, result, "Password changed successfully"));
});

/**
 * POST /api/v1/auth/forgot-password - Request password reset
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateForgotPassword(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const result = await AuthService.forgotPassword(req.body.email);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/auth/reset-password - Reset password using token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateResetPassword(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const result = await AuthService.resetPassword(req.body);
  return res.status(200).json(new ApiResponse(200, result, "Password reset successfully"));
});

/**
 * POST /api/v1/auth/verify-email - Verify email address
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateVerifyEmail(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const result = await AuthService.verifyEmail(req.body.token);
  return res.status(200).json(new ApiResponse(200, result, "Email verified successfully"));
});

/**
 * POST /api/v1/auth/resend-verification - Resend verification token
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const { isValid, errors } = AuthValidator.validateForgotPassword(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const result = await AuthService.resendVerification(req.body.email);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/auth/accept-invitation - Accept invitation and activate account
 */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const { token, password, firstName, lastName } = req.body;
  if (!token || !password) {
    throw new ApiError(400, "Token and password are required");
  }

  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.ip || req.connection.remoteAddress || "";

  const result = await AuthService.acceptInvitation({
    token,
    password,
    firstName,
    lastName,
    userAgent,
    ipAddress,
  });

  return res.status(200).json(new ApiResponse(200, result, "Invitation accepted and account activated"));
});
