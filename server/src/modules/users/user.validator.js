import mongoose from "mongoose";
import { USER_STATUS_LIST } from "../../constants/userStatuses.js";
import { MEMBERSHIP_STATUS_LIST } from "../../constants/membershipStatuses.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserValidator {
  /**
   * Validates creation of a new user
   */
  static validateCreateUser(body) {
    const errors = [];

    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }

    if (!body.firstName || typeof body.firstName !== "string" || body.firstName.trim().length < 2) {
      errors.push("First name must be at least 2 characters");
    }

    if (!body.email || typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      errors.push("A valid email address is required");
    }

    if (body.password && (typeof body.password !== "string" || body.password.length < 6)) {
      errors.push("Password must be at least 6 characters");
    }

    // Security: Block self-assignment of platform roles
    if (body.platformRole !== undefined) {
      errors.push("Field 'platformRole' is server-controlled and cannot be supplied by the client");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates profile updates for a universal user
   */
  static validateUpdateUser(body) {
    const errors = [];

    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }

    // Security: Block forbidden immutable and server-managed fields
    const forbiddenFields = [
      "_id",
      "id",
      "email",
      "password",
      "passwordHash",
      "platformRole",
      "status",
      "emailVerified",
      "emailVerifiedAt",
      "failedLoginAttempts",
      "lockUntil",
      "tokenVersion",
      "organizationId",
      "roleId",
    ];

    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        errors.push(`Field '${field}' cannot be modified through this endpoint`);
      }
    }

    if (body.firstName !== undefined) {
      if (typeof body.firstName !== "string" || body.firstName.trim().length < 2) {
        errors.push("First name must be at least 2 characters");
      }
    }

    if (body.lastName !== undefined && typeof body.lastName !== "string") {
      errors.push("Last name must be a string");
    }

    if (body.profile && typeof body.profile !== "object") {
      errors.push("Profile must be an object");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates universal user status update
   */
  static validateStatusUpdate(body) {
    const errors = [];

    if (!body || typeof body !== "object" || !body.status) {
      return { isValid: false, errors: ["User status is required"] };
    }

    if (!USER_STATUS_LIST.includes(body.status)) {
      errors.push(`Status must be one of: ${USER_STATUS_LIST.join(", ")}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates creation of an organization membership
   */
  static validateCreateMembership(body) {
    const errors = [];

    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }

    // 1. Organization ID check
    if (!body.organizationId || !mongoose.Types.ObjectId.isValid(body.organizationId)) {
      errors.push("Valid organizationId is required");
    }

    // 2. Role ID check
    if (!body.roleId || !mongoose.Types.ObjectId.isValid(body.roleId)) {
      errors.push("Valid roleId is required");
    }

    // 3. Status check if provided
    if (body.status && !MEMBERSHIP_STATUS_LIST.includes(body.status)) {
      errors.push(`Status must be one of: ${MEMBERSHIP_STATUS_LIST.join(", ")}`);
    }

    // 4. Security checks
    if (body.userId !== undefined) {
      errors.push("Field 'userId' must be specified in the URL parameter, not in the body");
    }

    if (body.platformRole !== undefined) {
      errors.push("Field 'platformRole' cannot be assigned to organization memberships");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validates update of an organization membership
   */
  static validateUpdateMembership(body) {
    const errors = [];

    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }

    if (body.roleId !== undefined && !mongoose.Types.ObjectId.isValid(body.roleId)) {
      errors.push("Valid roleId is required");
    }

    if (body.status !== undefined && !MEMBERSHIP_STATUS_LIST.includes(body.status)) {
      errors.push(`Status must be one of: ${MEMBERSHIP_STATUS_LIST.join(", ")}`);
    }

    const forbiddenFields = ["_id", "id", "userId", "organizationId", "platformRole"];
    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        errors.push(`Field '${field}' cannot be modified through this endpoint`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
