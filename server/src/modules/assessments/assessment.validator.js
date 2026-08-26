import { ASSESSMENT_STATUS } from "./assessment.constants.js";
import { ASSESSMENT_TYPE_LIST } from "../../constants/assessmentTypes.js";

export class AssessmentValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body.title || typeof body.title !== "string" || body.title.trim().length < 3) {
      errors.push("Title is required and must be at least 3 characters");
    }
    if (body.type && !ASSESSMENT_TYPE_LIST.includes(body.type)) {
      errors.push(`Type must be one of: ${ASSESSMENT_TYPE_LIST.join(", ")}`);
    }
    if (body.durationMinutes !== undefined && (typeof body.durationMinutes !== "number" || body.durationMinutes < 1)) {
      errors.push("Duration must be a positive number of minutes");
    }
    if (body.passingPercentage !== undefined && (typeof body.passingPercentage !== "number" || body.passingPercentage < 0 || body.passingPercentage > 100)) {
      errors.push("Passing percentage must be between 0 and 100");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdate(body) {
    const errors = [];
    if (body.title && (typeof body.title !== "string" || body.title.trim().length < 3)) {
      errors.push("Title must be at least 3 characters");
    }
    if (body.status && !Object.values(ASSESSMENT_STATUS).includes(body.status)) {
      errors.push(`Status must be one of: ${Object.values(ASSESSMENT_STATUS).join(", ")}`);
    }
    return { isValid: errors.length === 0, errors };
  }
}
