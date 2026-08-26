import { ApiError } from "../utils/ApiError.js";

// In-memory token bucket rate limiter for demonstration/fallback
const rateLimitMap = new Map();

export const rateLimiter = ({ windowMs = 60 * 1000, max = 100 } = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const now = Date.now();

    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(ip, record);

    if (record.count > max) {
      return next(new ApiError(429, "Too many requests. Please try again later."));
    }

    next();
  };
};
