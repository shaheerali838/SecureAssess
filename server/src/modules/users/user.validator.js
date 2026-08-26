import { ROLE_LIST } from "../../constants/roles.js";
import { USER_STATUS_LIST } from "../../constants/userStatuses.js";

export class UserValidator {
  static validateCreateUser(body) {
    const errors = [];
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push("A valid email address is required");
    }
    if (!body.password || body.password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (body.role && !ROLE_LIST.includes(body.role)) {
      errors.push(`Role must be one of: ${ROLE_LIST.join(", ")}`);
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdateUser(body) {
    const errors = [];
    if (body.name && (typeof body.name !== "string" || body.name.trim().length < 2)) {
      errors.push("Name must be at least 2 characters");
    }
    if (body.status && !USER_STATUS_LIST.includes(body.status)) {
      errors.push(`Status must be one of: ${USER_STATUS_LIST.join(", ")}`);
    }
    return { isValid: errors.length === 0, errors };
  }
}
