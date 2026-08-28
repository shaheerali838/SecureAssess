import mongoose from "mongoose";

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
    if (!body.email || typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
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
    if (body.status && !["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INVITED, SUSPENDED, DEACTIVATED");
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
    if (body.email !== undefined && (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))) {
      errors.push("A valid email address is required");
    }
    if (body.departmentId !== undefined && body.departmentId !== null && !mongoose.Types.ObjectId.isValid(body.departmentId)) {
      errors.push("Invalid departmentId format");
    }
    if (body.programId !== undefined && body.programId !== null && !mongoose.Types.ObjectId.isValid(body.programId)) {
      errors.push("Invalid programId format");
    }
    if (body.status && !["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INVITED, SUSPENDED, DEACTIVATED");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateStatusUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object" || !body.status) {
      return { isValid: false, errors: ["Status is required"] };
    }
    if (!["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"].includes(body.status)) {
      errors.push("Status must be one of: ACTIVE, INVITED, SUSPENDED, DEACTIVATED");
    }
    return { isValid: errors.length === 0, errors };
  }
}
