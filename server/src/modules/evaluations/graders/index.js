import { QUESTION_TYPES } from "../../../constants/questionTypes.js";
import { gradeSingleChoice } from "./singleChoice.grader.js";
import { gradeMultipleChoice } from "./multipleChoice.grader.js";
import { gradeTrueFalse } from "./trueFalse.grader.js";
import { gradeShortAnswer } from "./shortAnswer.grader.js";
import { gradeManual } from "./manual.grader.js";
import { gradeCoding } from "./coding.grader.js";

export const GRADER_REGISTRY = {
  [QUESTION_TYPES.SINGLE_CHOICE]: gradeSingleChoice,
  [QUESTION_TYPES.MULTIPLE_CHOICE]: gradeMultipleChoice,
  [QUESTION_TYPES.TRUE_FALSE]: gradeTrueFalse,
  [QUESTION_TYPES.SHORT_ANSWER]: gradeShortAnswer,
  [QUESTION_TYPES.ESSAY]: gradeManual,
  [QUESTION_TYPES.CODING]: gradeCoding,
  [QUESTION_TYPES.VIDEO_RESPONSE]: gradeManual,
};

export const getGraderForType = (questionType) => {
  return GRADER_REGISTRY[questionType] || gradeManual;
};
