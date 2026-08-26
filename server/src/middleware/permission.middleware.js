import { ApiError } from "../utils/ApiError.js";

export const requirePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const userPermissions = req.user.permissions || [];
    const hasAll = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasAll && req.user.role !== "SUPER_ADMIN" && req.user.role !== "ADMIN") {
      return next(
        new ApiError(403, `Forbidden. Missing required permissions: [${requiredPermissions.join(", ")}]`)
      );
    }

    next();
  };
};
