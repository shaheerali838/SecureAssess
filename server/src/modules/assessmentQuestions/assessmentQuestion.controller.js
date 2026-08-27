import { AssessmentQuestionService } from "./assessmentQuestion.service.js";
import { AssessmentQuestionValidator } from "./assessmentQuestion.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const addQuestionToAssessment = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentQuestionValidator.validateAdd(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, assessmentId } = req.params;
  const question = await AssessmentQuestionService.addQuestionToAssessment(
    organizationId,
    assessmentId,
    req.body
  );
  return res.status(201).json(new ApiResponse(201, question, "Question added to assessment snapshot successfully"));
});

export const getAssessmentQuestions = asyncHandler(async (req, res) => {
  const { organizationId, assessmentId } = req.params;
  const questions = await AssessmentQuestionService.getAssessmentQuestions(
    organizationId,
    assessmentId,
    req.query,
    req
  );
  return res.status(200).json(new ApiResponse(200, questions, "Assessment questions retrieved successfully"));
});

export const updateAssessmentQuestion = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentQuestionValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, assessmentId, assessmentQuestionId } = req.params;
  const updated = await AssessmentQuestionService.updateAssessmentQuestion(
    organizationId,
    assessmentId,
    assessmentQuestionId,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, updated, "Assessment question updated successfully"));
});

export const removeAssessmentQuestion = asyncHandler(async (req, res) => {
  const { organizationId, assessmentId, assessmentQuestionId } = req.params;
  const result = await AssessmentQuestionService.removeAssessmentQuestion(
    organizationId,
    assessmentId,
    assessmentQuestionId
  );
  return res.status(200).json(new ApiResponse(200, result, "Assessment question removed successfully"));
});
