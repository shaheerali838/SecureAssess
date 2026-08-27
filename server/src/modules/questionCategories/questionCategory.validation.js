import mongoose from "mongoose";

export class QuestionCategoryValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
      errors.push("Category name is required");
    }
    if (body.parentCategoryId && !mongoose.Types.ObjectId.isValid(body.parentCategoryId)) {
      errors.push("Invalid parentCategoryId format");
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
    if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 1)) {
      errors.push("Category name cannot be empty");
    }
    if (body.parentCategoryId !== undefined && body.parentCategoryId !== null && !mongoose.Types.ObjectId.isValid(body.parentCategoryId)) {
      errors.push("Invalid parentCategoryId format");
    }
    if (body.status && !["ACTIVE", "INACTIVE", "ARCHIVED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INACTIVE, ARCHIVED");
    }
    return { isValid: errors.length === 0, errors };
  }
}
