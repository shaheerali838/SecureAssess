import mongoose from "mongoose";
import { ASSESSMENT_TYPE_LIST } from "../../constants/assessmentTypes.js";

export class AssessmentValidator {
  static validateCreate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.title || typeof body.title !== "string" || body.title.trim().length < 2) {
      errors.push("Assessment title must be at least 2 characters");
    }
    if (!body.code || typeof body.code !== "string" || body.code.trim().length < 1) {
      errors.push("Assessment code is required");
    }
    if (body.type && !ASSESSMENT_TYPE_LIST.includes(body.type)) {
      errors.push(`Assessment type must be one of: ${ASSESSMENT_TYPE_LIST.join(", ")}`);
    }
    if (body.durationSeconds !== undefined && (typeof body.durationSeconds !== "number" || body.durationSeconds < 60)) {
      errors.push("Duration must be at least 60 seconds (1 minute)");
    }
    if (body.passingScore !== undefined && (typeof body.passingScore !== "number" || body.passingScore < 0 || body.passingScore > 100)) {
      errors.push("Passing score must be between 0 and 100 percentage");
    }
    if (body.subjectId && !mongoose.Types.ObjectId.isValid(body.subjectId)) {
      errors.push("Invalid subjectId format");
    }
    if (body.departmentId && !mongoose.Types.ObjectId.isValid(body.departmentId)) {
      errors.push("Invalid departmentId format");
    }
    if (body.programId && !mongoose.Types.ObjectId.isValid(body.programId)) {
      errors.push("Invalid programId format");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateUpdate(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (body.title !== undefined && (typeof body.title !== "string" || body.title.trim().length < 2)) {
      errors.push("Assessment title must be at least 2 characters");
    }
    if (body.type !== undefined && !ASSESSMENT_TYPE_LIST.includes(body.type)) {
      errors.push(`Assessment type must be one of: ${ASSESSMENT_TYPE_LIST.join(", ")}`);
    }
    if (body.durationSeconds !== undefined && (typeof body.durationSeconds !== "number" || body.durationSeconds < 60)) {
      errors.push("Duration must be at least 60 seconds (1 minute)");
    }
    if (body.passingScore !== undefined && (typeof body.passingScore !== "number" || body.passingScore < 0 || body.passingScore > 100)) {
      errors.push("Passing score must be between 0 and 100 percentage");
    }
    return { isValid: errors.length === 0, errors };
  }
}
