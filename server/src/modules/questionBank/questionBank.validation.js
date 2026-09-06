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

    const promptText = body.prompt || body.title || body.stem || body.content?.text;
    if (!promptText || typeof promptText !== "string" || promptText.trim().length < 1) {
      errors.push("Question prompt or title is required");
    }

    let type = body.type || QUESTION_TYPES.SINGLE_CHOICE;
    if (type === "MCQ" || type === "Multiple Choice") type = QUESTION_TYPES.SINGLE_CHOICE;
    if (type === "Coding") type = QUESTION_TYPES.CODING;
    if (type === "True / False" || type === "TRUE_FALSE") type = QUESTION_TYPES.TRUE_FALSE;

    if (body.difficulty) {
      const diff = body.difficulty.toUpperCase();
      if (!["EASY", "MEDIUM", "HARD", "EXPERT"].includes(diff)) {
        errors.push("Difficulty must be one of: EASY, MEDIUM, HARD, EXPERT");
      }
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
        errors.push("Choice questions require at least 2 options");
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
