export class AssessmentSectionValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.title || typeof body.title !== "string" || body.title.trim().length < 1) {
      errors.push("Section title is required");
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
    if (body.title !== undefined && (typeof body.title !== "string" || body.title.trim().length < 1)) {
      errors.push("Section title cannot be empty");
    }
    if (body.points !== undefined && (typeof body.points !== "number" || body.points < 0)) {
      errors.push("Points must be a non-negative number");
    }
    return { isValid: errors.length === 0, errors };
  }
}
