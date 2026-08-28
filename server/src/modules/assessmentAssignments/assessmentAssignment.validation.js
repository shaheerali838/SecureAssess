import mongoose from "mongoose";

export class AssessmentAssignmentValidator {
  static validateIndividual(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!Array.isArray(body.candidateIds) || body.candidateIds.length === 0) {
      errors.push("candidateIds must be a non-empty array of candidate IDs");
    } else {
      for (const id of body.candidateIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push(`Invalid candidate ID format: ${id}`);
          break;
        }
      }
    }
    if (body.attemptLimit !== undefined && (typeof body.attemptLimit !== "number" || body.attemptLimit < 1)) {
      errors.push("attemptLimit must be a positive number");
    }
    if (body.availableFrom && body.availableUntil) {
      if (new Date(body.availableFrom) >= new Date(body.availableUntil)) {
        errors.push("availableFrom must be before availableUntil");
      }
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateGroup(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.groupId || !mongoose.Types.ObjectId.isValid(body.groupId)) {
      errors.push("Valid groupId is required");
    }
    if (body.attemptLimit !== undefined && (typeof body.attemptLimit !== "number" || body.attemptLimit < 1)) {
      errors.push("attemptLimit must be a positive number");
    }
    if (body.availableFrom && body.availableUntil) {
      if (new Date(body.availableFrom) >= new Date(body.availableUntil)) {
        errors.push("availableFrom must be before availableUntil");
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}
