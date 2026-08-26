export const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/[<>]/g, "").trim();
};

export const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] =
        typeof obj[key] === "string"
          ? sanitizeString(obj[key])
          : typeof obj[key] === "object"
          ? sanitizeObject(obj[key])
          : obj[key];
    }
  }
  return sanitized;
};
