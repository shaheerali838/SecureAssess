import mongoose from "mongoose";

export class ProgramValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.push("Program name must be at least 2 characters");
    }
    if (!body.code || typeof body.code !== "string" || body.code.trim().length < 1) {
      errors.push("Program code is required");
    }
    if (!body.departmentId || !mongoose.Types.ObjectId.isValid(body.departmentId)) {
      errors.push("Valid departmentId is required");
    }
    if (body.status && !["ACTIVE", "INACTIVE", "ARCHIVED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INACTIVE, ARCHIVED");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 2)) {
      errors.push("Program name must be at least 2 characters");
    }
    if (body.code !== undefined && (typeof body.code !== "string" || body.code.trim().length < 1)) {
      errors.push("Program code must be a non-empty string");
    }
    if (body.departmentId !== undefined && !mongoose.Types.ObjectId.isValid(body.departmentId)) {
      errors.push("Valid departmentId format required");
    }
    if (body.status && !["ACTIVE", "INACTIVE", "ARCHIVED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INACTIVE, ARCHIVED");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateStatusUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object" || !body.status) {
      return { isValid: false, errors: ["Status is required"] };
    }
    if (!["ACTIVE", "INACTIVE", "ARCHIVED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INACTIVE, ARCHIVED");
    }
    return { isValid: errors.length === 0, errors };
  }
}
