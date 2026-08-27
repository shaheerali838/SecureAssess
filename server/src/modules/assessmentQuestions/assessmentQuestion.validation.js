import mongoose from "mongoose";

export class AssessmentQuestionValidator {
  static validateAdd(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.questionId || !mongoose.Types.ObjectId.isValid(body.questionId)) {
      errors.push("Valid questionId is required");
    }
    if (!body.sectionId || !mongoose.Types.ObjectId.isValid(body.sectionId)) {
      errors.push("Valid sectionId is required");
    }
    if (body.points !== undefined && (typeof body.points !== "number" || body.points < 0)) {
      errors.push("Points must be a non-negative number");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (body.points !== undefined && (typeof body.points !== "number" || body.points < 0)) {
      errors.push("Points must be a non-negative number");
    }
    return { isValid: errors.length === 0, errors };
  }
}
