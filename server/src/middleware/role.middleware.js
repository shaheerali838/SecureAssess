import { ApiError } from "../utils/ApiError.js";

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      return next(
        new ApiError(403, `Access denied. Requires one of: [${allowedRoles.join(", ")}]`)
      );
    }

    next();
  };
};
