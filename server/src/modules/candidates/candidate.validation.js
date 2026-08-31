import mongoose from "mongoose";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CandidateValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.firstName || typeof body.firstName !== "string" || body.firstName.trim().length < 1) {
      errors.push("First name is required");
    }
    if (!body.lastName || typeof body.lastName !== "string" || body.lastName.trim().length < 1) {
      errors.push("Last name is required");
    }
    if (!body.email || typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim())) {
      errors.push("A valid email address is required");
    }
    if (!body.candidateCode || typeof body.candidateCode !== "string" || body.candidateCode.trim().length < 1) {
      errors.push("Candidate code is required");
    }
    if (body.departmentId && !mongoose.Types.ObjectId.isValid(body.departmentId)) {
      errors.push("Invalid departmentId format");
    }
    if (body.programId && !mongoose.Types.ObjectId.isValid(body.programId)) {
      errors.push("Invalid programId format");
    }
    if (body.candidateGroupId && !mongoose.Types.ObjectId.isValid(body.candidateGroupId)) {
      errors.push("Invalid candidateGroupId format");
    }
    if (body.status && !["ACTIVE", "INVITED", "SUSPENDED", "INACTIVE", "DEACTIVATED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INVITED, SUSPENDED, INACTIVE, DEACTIVATED");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (body.firstName !== undefined && (typeof body.firstName !== "string" || body.firstName.trim().length < 1)) {
      errors.push("First name cannot be empty");
    }
    if (body.lastName !== undefined && (typeof body.lastName !== "string" || body.lastName.trim().length < 1)) {
      errors.push("Last name cannot be empty");
    }
    if (body.email !== undefined && (typeof body.email !== "string" || !EMAIL_REGEX.test(body.email.trim()))) {
      errors.push("A valid email address is required");
    }
    if (body.departmentId !== undefined && body.departmentId !== null && !mongoose.Types.ObjectId.isValid(body.departmentId)) {
      errors.push("Invalid departmentId format");
    }
    if (body.programId !== undefined && body.programId !== null && !mongoose.Types.ObjectId.isValid(body.programId)) {
      errors.push("Invalid programId format");
    }
    if (body.candidateGroupId !== undefined && body.candidateGroupId !== null && !mongoose.Types.ObjectId.isValid(body.candidateGroupId)) {
      errors.push("Invalid candidateGroupId format");
    }
    if (body.status && !["ACTIVE", "INVITED", "SUSPENDED", "INACTIVE", "DEACTIVATED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INVITED, SUSPENDED, INACTIVE, DEACTIVATED");
    }

    // Security Guard: Prevent modifying server-controlled fields
    const forbiddenFields = ["_id", "id", "organizationId", "candidateCode", "userId", "createdAt", "updatedAt"];
    for (const field of forbiddenFields) {
      if (body[field] !== undefined) {
        errors.push(`Field '${field}' is server-managed and cannot be altered`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateStatusUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object" || !body.status) {
      return { isValid: false, errors: ["Status is required"] };
    }
    if (!["ACTIVE", "INVITED", "SUSPENDED", "INACTIVE", "DEACTIVATED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INVITED, SUSPENDED, INACTIVE, DEACTIVATED");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateBulkImport(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { isValid: false, errors: ["A non-empty array of candidate records is required for bulk import"] };
    }

    const rowErrors = [];
    items.forEach((row, idx) => {
      const { isValid, errors } = this.validateCreate(row);
      if (!isValid) {
        rowErrors.push({ row: idx + 1, errors });
      }
    });

    return {
      isValid: rowErrors.length === 0,
      errors: rowErrors,
      totalRows: items.length,
      validRows: items.length - rowErrors.length,
    };
  }
}

export default CandidateValidator;
