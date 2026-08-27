import mongoose from "mongoose";
import { QUESTION_TYPE_LIST, QUESTION_TYPES } from "../../constants/questionTypes.js";

export class QuestionBankValidator {
  static validateQuestionBank(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 2) {
      errors.push("Question bank name must be at least 2 characters");
    }
    if (!body.code || typeof body.code !== "string" || body.code.trim().length < 1) {
      errors.push("Question bank code is required");
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
    if (body.status && !["ACTIVE", "ARCHIVED"].includes(body.status)) {
      errors.push("Status must be ACTIVE or ARCHIVED");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateQuestion(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }

    if (!body.prompt || typeof body.prompt !== "string" || body.prompt.trim().length < 1) {
      errors.push("Question prompt is required");
    }

    const type = body.type || QUESTION_TYPES.SINGLE_CHOICE;
    if (!QUESTION_TYPE_LIST.includes(type)) {
      errors.push(`Invalid question type. Must be one of: ${QUESTION_TYPE_LIST.join(", ")}`);
    }

    if (body.difficulty && !["EASY", "MEDIUM", "HARD"].includes(body.difficulty)) {
      errors.push("Difficulty must be one of: EASY, MEDIUM, HARD");
    }

    if (body.points !== undefined && (typeof body.points !== "number" || body.points < 0)) {
      errors.push("Points must be a non-negative number");
    }

    if (body.categoryId && !mongoose.Types.ObjectId.isValid(body.categoryId)) {
      errors.push("Invalid categoryId format");
    }

    if (body.subjectId && !mongoose.Types.ObjectId.isValid(body.subjectId)) {
      errors.push("Invalid subjectId format");
    }

    // Type-specific field validations
    if (type === QUESTION_TYPES.SINGLE_CHOICE || type === QUESTION_TYPES.MULTIPLE_CHOICE) {
      if (!Array.isArray(body.options) || body.options.length < 2) {
        errors.push("MCQ questions require at least 2 options");
      } else {
        const optionIds = body.options.map((opt) => opt.id);
        const uniqueIds = new Set(optionIds);
        if (uniqueIds.size !== optionIds.length) {
          errors.push("Option IDs must be unique (e.g. A, B, C, D)");
        }

        for (const opt of body.options) {
          if (!opt.id || !opt.text) {
            errors.push("Every option must have an 'id' and 'text'");
            break;
          }
        }

        if (!Array.isArray(body.correctAnswer) || body.correctAnswer.length === 0) {
          errors.push("correctAnswer must be a non-empty array of option IDs");
        } else {
          for (const ansId of body.correctAnswer) {
            if (!optionIds.includes(ansId)) {
              errors.push(`correctAnswer '${ansId}' does not match any valid option ID`);
            }
          }
          if (type === QUESTION_TYPES.SINGLE_CHOICE && body.correctAnswer.length !== 1) {
            errors.push("SINGLE_CHOICE question must have exactly one correct answer ID");
          }
        }
      }
    } else if (type === QUESTION_TYPES.TRUE_FALSE) {
      if (typeof body.correctAnswer !== "boolean") {
        errors.push("TRUE_FALSE question requires correctAnswer to be boolean true or false");
      }
    } else if (type === QUESTION_TYPES.SHORT_ANSWER) {
      if (!body.correctAnswer || (!Array.isArray(body.correctAnswer) && typeof body.correctAnswer !== "string")) {
        errors.push("SHORT_ANSWER requires correctAnswer (string or array of accepted strings)");
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
