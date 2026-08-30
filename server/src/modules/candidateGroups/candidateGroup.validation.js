import mongoose from "mongoose";

export class CandidateGroupValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
      errors.push("Group name is required");
    }
    if (!body.code || typeof body.code !== "string" || body.code.trim().length < 1) {
      errors.push("Group code is required");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 1)) {
      errors.push("Group name cannot be empty");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateMember(body) {
    const errors = [];
    if (!body || typeof body !== "object" || !body.candidateId || !mongoose.Types.ObjectId.isValid(body.candidateId)) {
      errors.push("Valid candidateId is required");
    }
    return { isValid: errors.length === 0, errors };
  }
}
