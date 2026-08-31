import { ENV } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  logger.error(`[${req.method}] ${req.originalUrl} - ${error.statusCode} ${error.message}`);

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: false,
    requestId: req.requestId || null,
    errors: error.errors || [],
    ...(ENV.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};
