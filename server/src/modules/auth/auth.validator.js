import { ROLE_LIST } from "../../constants/roles.js";

export class AuthValidator {
  static validateRegister(body) {
    const errors = [];
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push("A valid email address is required");
    }
    if (!body.password || body.password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    if (!body.role || !ROLE_LIST.includes(body.role)) {
      errors.push(`Role is required and must be one of: ${ROLE_LIST.join(", ")}`);
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateLogin(body) {
    const errors = [];
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.push("A valid email address is required");
    }
    if (!body.password) {
      errors.push("Password is required");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateRefreshToken(body) {
    const errors = [];
    if (!body.refreshToken || typeof body.refreshToken !== "string") {
      errors.push("Refresh token is required");
    }
    return { isValid: errors.length === 0, errors };
  }
}
