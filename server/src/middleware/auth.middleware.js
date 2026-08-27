import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/token.js";
import User from "../modules/users/user.model.js";
import { USER_STATUSES } from "../constants/userStatuses.js";

/**
 * Authentication Middleware:
 * Verifies Bearer JWT, fetches current active User, and attaches to req.user.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization;
  if (!token) {
    throw new ApiError(401, "Authentication token missing or invalid");
  }

  if (token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = verifyAccessToken(token);
    const userId = decoded.sub || decoded.id || decoded.userId;

    if (!userId) {
      throw new ApiError(401, "Invalid token claims: subject identifier missing");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(401, "User identity associated with this token no longer exists");
    }

    if (user.status !== USER_STATUSES.ACTIVE) {
      throw new ApiError(403, `Account access denied. Account status is '${user.status}'`);
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      platformRole: user.platformRole,
      status: user.status,
      sessionId: decoded.sessionId || null,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid or expired authentication token", [error.message]);
  }
});
