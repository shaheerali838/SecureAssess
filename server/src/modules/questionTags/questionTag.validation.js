export class QuestionTagValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
      errors.push("Tag name is required");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 1)) {
      errors.push("Tag name cannot be empty");
    }
    return { isValid: errors.length === 0, errors };
  }
}
