/**
 * NoSQL Query Injection Protection Middleware (Express 5.x compatible)
 * Recursively cleans MongoDB operator keys in-place ($ operators and dot notation)
 * without reassigning req.query / req.params getters.
 */

const sanitizeInPlace = (target) => {
  if (!target || typeof target !== "object") {
    return;
  }

  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      if (target[i] && typeof target[i] === "object") {
        sanitizeInPlace(target[i]);
      }
    }
    return;
  }

  const keys = Object.keys(target);
  for (const key of keys) {
    // Block MongoDB query injection operator keys like $where, $gt, $ne, $regex
    if (key.startsWith("$") || key.includes(".")) {
      delete target[key];
    } else if (target[key] && typeof target[key] === "object") {
      sanitizeInPlace(target[key]);
    }
  }
};

export const mongoSanitize = (req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      sanitizeInPlace(req.body);
    }

    if (req.query && typeof req.query === "object") {
      sanitizeInPlace(req.query);
    }

    if (req.params && typeof req.params === "object") {
      sanitizeInPlace(req.params);
    }
  } catch (err) {
    // Graceful fallback to prevent request crashing
  }

  next();
};
