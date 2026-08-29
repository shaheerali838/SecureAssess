import { ApiError } from "../utils/ApiError.js";

export const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    if (!schema) return next();

    // Supports Joi/Zod or simple custom validator function
    if (typeof schema.validate === "function") {
      const { error, value } = schema.validate(req[source], { abortEarly: false });
      if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        return next(new ApiError(400, "Validation failed", errorMessages));
      }
      if (source === "body") {
        req.body = value;
      } else if (value && typeof value === "object") {
        Object.assign(req[source], value);
      }
    } else if (typeof schema.safeParse === "function") {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const errorMessages = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return next(new ApiError(400, "Validation failed", errorMessages));
      }
      if (source === "body") {
        req.body = result.data;
      } else if (result.data && typeof result.data === "object") {
        Object.assign(req[source], result.data);
      }
    }

    next();
  };
};
