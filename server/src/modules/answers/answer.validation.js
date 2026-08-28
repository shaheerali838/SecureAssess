import { QUESTION_TYPES } from "../../constants/questionTypes.js";

export class AnswerValidator {
  /**
   * Server-authoritative answer validation against runtime question type
   */
  static validateAnswerForType(questionType, answerPayload) {
    const errors = [];
    if (!answerPayload || typeof answerPayload !== "object") {
      return { isValid: false, errors: ["Answer payload is required"] };
    }

    // Explicitly reject tampering attempts
    if (
      answerPayload.points !== undefined ||
      answerPayload.isCorrect !== undefined ||
      answerPayload.score !== undefined ||
      answerPayload.correctAnswer !== undefined
    ) {
      errors.push("Unauthorized grading fields detected in answer payload");
    }

    switch (questionType) {
      case QUESTION_TYPES.SINGLE_CHOICE:
      case QUESTION_TYPES.TRUE_FALSE:
        if (
          answerPayload.selectedOptionId !== null &&
          answerPayload.selectedOptionId !== undefined &&
          typeof answerPayload.selectedOptionId !== "string"
        ) {
          errors.push("selectedOptionId must be a string or null");
        }
        break;

      case QUESTION_TYPES.MULTIPLE_CHOICE:
        if (
          answerPayload.selectedOptionIds !== undefined &&
          !Array.isArray(answerPayload.selectedOptionIds)
        ) {
          errors.push("selectedOptionIds must be an array of strings");
        }
        break;

      case QUESTION_TYPES.SHORT_ANSWER:
      case QUESTION_TYPES.ESSAY:
        if (
          answerPayload.text !== undefined &&
          typeof answerPayload.text !== "string"
        ) {
          errors.push("text must be a string");
        }
        break;

      case QUESTION_TYPES.CODING:
        if (
          answerPayload.code !== undefined &&
          typeof answerPayload.code !== "string"
        ) {
          errors.push("code must be a string");
        }
        if (
          answerPayload.language !== undefined &&
          typeof answerPayload.language !== "string"
        ) {
          errors.push("language must be a string");
        }
        break;

      default:
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateNavigation(body) {
    const errors = [];
    if (!body || typeof body !== "object" || body.questionIndex === undefined) {
      return { isValid: false, errors: ["questionIndex is required"] };
    }
    if (typeof body.questionIndex !== "number" || !Number.isInteger(body.questionIndex) || body.questionIndex < 0) {
      errors.push("questionIndex must be a non-negative integer");
    }
    return { isValid: errors.length === 0, errors };
  }
}
