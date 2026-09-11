const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthValidator {
  static validateLogin(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.email || typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      errors.push("A valid email address is required");
    }
    if (!body.password || typeof body.password !== "string") {
      errors.push("Password is required");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateRefreshToken(body) {
    const errors = [];
    if (!body || typeof body !== "object" || !body.refreshToken || typeof body.refreshToken !== "string") {
      errors.push("refreshToken is required");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateChangePassword(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.currentPassword || typeof body.currentPassword !== "string") {
      errors.push("Current password is required");
    }
    if (!body.newPassword || typeof body.newPassword !== "string" || body.newPassword.length < 6) {
      errors.push("New password must be at least 6 characters long");
    }
    if (body.currentPassword && body.newPassword && body.currentPassword === body.newPassword) {
      errors.push("New password must be different from current password");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateForgotPassword(body) {
    const errors = [];
    if (!body || typeof body !== "object" || !body.email || typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      errors.push("A valid email address is required");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateResetPassword(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    const token = body.token || body.setupToken || body.inviteToken || body.resetToken;
    if (!token || typeof token !== "string") {
      errors.push("Reset token is required");
    }
    const password = body.newPassword || body.password;
    if (!password || typeof password !== "string" || password.length < 6) {
      errors.push("New password must be at least 6 characters long");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateAcceptInvitation(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    const token = body.token || body.setupToken || body.inviteToken || body.resetToken;
    if (!token || typeof token !== "string") {
      errors.push("Invitation token is required");
    }
    const password = body.password || body.newPassword;
    if (!password || typeof password !== "string" || password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateVerifyEmail(body) {
    const errors = [];
    if (!body || typeof body !== "object" || !body.token || typeof body.token !== "string") {
      errors.push("Verification token is required");
    }
    return { isValid: errors.length === 0, errors };
  }
}

