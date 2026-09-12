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

    // Auto-generate code if not provided
    if (!body.code || typeof body.code !== "string" || body.code.trim().length < 1) {
      body.code = `ASM-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Normalize type
    if (body.type) {
      let normType = String(body.type).toUpperCase().trim().replace(/\s+/g, "_");
      if (normType === "MCQ_TEST" || normType === "KNOWLEDGE_ASSESSMENT" || normType === "APTITUDE_TEST") normType = "MCQ";
      if (normType === "INTERVIEW_ASSESSMENT" || normType === "LIVE_INTERVIEW") normType = "VIDEO_INTERVIEW";
      if (normType === "SCENARIO_ASSESSMENT") normType = "HYBRID";
      if (normType === "SKILLS_ASSESSMENT") normType = "SKILLS";
      if (normType === "CUSTOM_ASSESSMENT") normType = "CUSTOM";
      body.type = normType;
    } else {
      body.type = "MCQ";
    }

    if (!ASSESSMENT_TYPE_LIST.includes(body.type)) {
      errors.push(`Assessment type must be one of: ${ASSESSMENT_TYPE_LIST.join(", ")}`);
    }

    // Normalize duration
    if (body.durationSeconds === undefined) {
      if (typeof body.durationMinutes === "number" && body.durationMinutes > 0) {
        body.durationSeconds = body.durationMinutes * 60;
      } else if (typeof body.duration === "number" && body.duration > 0) {
        body.durationSeconds = body.duration * 60;
      } else if (body.duration && typeof body.duration === "object" && body.duration.value) {
        body.durationSeconds = body.duration.unit === "HOURS" ? body.duration.value * 3600 : body.duration.value * 60;
      }
    }

    if (body.durationSeconds !== undefined && (typeof body.durationSeconds !== "number" || body.durationSeconds < 60)) {
      errors.push("Duration must be at least 60 seconds (1 minute)");
    }

    // Normalize passingScore / passingPercentage
    if (body.passingScore === undefined && typeof body.passingPercentage === "number") {
      body.passingScore = body.passingPercentage;
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
    if (body.type !== undefined) {
      let normType = String(body.type).toUpperCase().trim().replace(/\s+/g, "_");
      if (normType === "MCQ_TEST") normType = "MCQ";
      if (!ASSESSMENT_TYPE_LIST.includes(normType)) {
        errors.push(`Assessment type must be one of: ${ASSESSMENT_TYPE_LIST.join(", ")}`);
      } else {
        body.type = normType;
      }
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
