import { ApiError } from "../utils/ApiError.js";
import { logger } from "../config/logger.js";
import { ENV } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Transform non-ApiError exceptions into controlled ApiError instances
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    
    // Sanitize database / Mongoose error messages in production
    let message = error.message || "An unexpected internal server error occurred";
    if (ENV.NODE_ENV === "production" && statusCode === 500) {
      message = "Internal Server Error";
    }

    error = new ApiError(
      statusCode,
      message,
      error.errors || [],
      err.stack
    );
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(ENV.NODE_ENV === "development" && { stack: error.stack }),
  };

  // Log detailed error internally
  if (error.statusCode >= 500) {
    logger.error(`[Internal Server Error] ${req.method} ${req.url}: ${err.message}`, {
      stack: err.stack,
      ip: req.ip,
    });
  } else {
    logger.warn(`[Client Error ${error.statusCode}] ${req.method} ${req.url}: ${error.message}`);
  }

  res.status(error.statusCode).json(response);
};
