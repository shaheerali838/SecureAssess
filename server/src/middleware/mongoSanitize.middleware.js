/**
 * NoSQL Query Injection Protection Middleware
 * Recursively sanitizes request body, query params, and route parameters
 * by stripping MongoDB operator keys (keys starting with '$' or containing '.')
 */

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    // Block MongoDB query injection operator keys like $where, $gt, $ne, $regex
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }

    if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }

  next();
};
