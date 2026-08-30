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
    if (body.status && !["ACTIVE", "ARCHIVED", "DELETED"].includes(body.status)) {
      errors.push("Status must be ACTIVE, ARCHIVED, or DELETED");
    }
    return { isValid: errors.length === 0, errors };
  }

  static validateQuestion(body) {
    const errors = [];
    if (!body || typeof body !== "object") {
      return { isValid: false, errors: ["Request body is required"] };
    }

    const promptText = body.prompt || body.title || body.content?.text;
    if (!promptText || typeof promptText !== "string" || promptText.trim().length < 1) {
      errors.push("Question prompt or title is required");
    }

    const type = body.type || QUESTION_TYPES.SINGLE_CHOICE;
    if (!QUESTION_TYPE_LIST.includes(type)) {
      errors.push(`Invalid question type. Must be one of: ${QUESTION_TYPE_LIST.join(", ")}`);
    }

    if (body.difficulty && !["EASY", "MEDIUM", "HARD", "EXPERT"].includes(body.difficulty)) {
      errors.push("Difficulty must be one of: EASY, MEDIUM, HARD, EXPERT");
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

    // Type-specific field validations (Step 35.9)
    if (type === QUESTION_TYPES.SINGLE_CHOICE) {
      if (!Array.isArray(body.options) || body.options.length < 2) {
        errors.push("SINGLE_CHOICE questions require at least 2 options");
      } else {
        const optionIds = body.options.map((opt) => opt.id);
        const uniqueIds = new Set(optionIds);
        if (uniqueIds.size !== optionIds.length) {
          errors.push("Option IDs must be unique (e.g. A, B, C, D)");
        }
      }
    } else if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
      if (!Array.isArray(body.options) || body.options.length < 2) {
        errors.push("MULTIPLE_CHOICE questions require at least 2 options");
      }
    } else if (type === QUESTION_TYPES.TRUE_FALSE) {
      if (body.correctAnswer === undefined && body.answer === undefined && (!body.options || body.options.length === 0)) {
        errors.push("TRUE_FALSE question requires a valid correct answer or true/false options");
      }
    } else if (type === QUESTION_TYPES.CODING) {
      if (body.coding && body.coding.testCases && !Array.isArray(body.coding.testCases)) {
        errors.push("Coding test cases must be an array");
      }
    } else if (type === QUESTION_TYPES.FILE_UPLOAD) {
      if (body.fileUpload && body.fileUpload.maxFileSize && typeof body.fileUpload.maxFileSize !== "number") {
        errors.push("maxFileSize must be a number in bytes");
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

export const createQuestionBankSchema = {
  validate: (body) => {
    const res = QuestionBankValidator.validateQuestionBank(body);
    return {
      error: res.isValid ? null : { details: res.errors.map((e) => ({ message: e })) },
      value: body,
    };
  },
};

export const createQuestionSchema = {
  validate: (body) => {
    const res = QuestionBankValidator.validateQuestion(body);
    return {
      error: res.isValid ? null : { details: res.errors.map((e) => ({ message: e })) },
      value: body,
    };
  },
};
