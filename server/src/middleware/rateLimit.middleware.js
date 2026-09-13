import { ApiError } from "../utils/ApiError.js";

// In-memory sliding window rate limiter stores
const rateLimitStores = new Map();

const getStore = (namespace) => {
  if (!rateLimitStores.has(namespace)) {
    rateLimitStores.set(namespace, new Map());
  }
  return rateLimitStores.get(namespace);
};

// Periodic garbage collection to prevent memory leaks (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const store of rateLimitStores.values()) {
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }
}, 10 * 60 * 1000).unref();

export const rateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 300,
  message = "Too many requests from this IP. Please try again later.",
  namespace = "global",
} = {}) => {
  const store = getStore(namespace);

  return (req, res, next) => {
    // Determine client IP address safely
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown_ip";

    const now = Date.now();
    const record = store.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    store.set(ip, record);

    // Set standard rate limit headers
    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetSeconds);

    if (record.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      return next(new ApiError(429, message));
    }

    next();
  };
};

/**
 * Strict rate limiter for sensitive authentication & security endpoints
 * 15 requests per 15-minute window
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
  namespace: "auth",
});

/**
 * General API rate limiter for standard endpoints
 * 300 requests per 15-minute window
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "API rate limit exceeded. Please throttle your requests.",
  namespace: "api",
});
