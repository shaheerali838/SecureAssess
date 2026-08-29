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

  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const question = await AssessmentQuestionService.addQuestionToAssessment(
    organizationId,
    assessmentId,
    req.body
  );
  return res.status(201).json(new ApiResponse(201, question, "Question added to assessment snapshot successfully"));
});

export const getAssessmentQuestions = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const questions = await AssessmentQuestionService.getAssessmentQuestions(
    organizationId,
    assessmentId,
    req.query,
    req.user
  );
  return res.status(200).json(new ApiResponse(200, questions, "Assessment questions retrieved successfully"));
});

export const updateAssessmentQuestion = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentQuestionValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId, questionId } = req.params;
  const targetId = questionId || req.params.assessmentQuestionId;
  const updated = await AssessmentQuestionService.updateAssessmentQuestion(
    organizationId,
    assessmentId,
    targetId,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, updated, "Assessment question updated successfully"));
});

export const removeAssessmentQuestion = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId, questionId } = req.params;
  const targetId = questionId || req.params.assessmentQuestionId;
  const result = await AssessmentQuestionService.removeAssessmentQuestion(
    organizationId,
    assessmentId,
    targetId
  );
  return res.status(200).json(new ApiResponse(200, result, "Assessment question removed successfully"));
});

export const reorderQuestions = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const questionsList = req.body.questions || req.body;
  const result = await AssessmentQuestionService.reorderQuestions(
    organizationId,
    assessmentId,
    questionsList
  );
  return res.status(200).json(new ApiResponse(200, result, "Questions reordered successfully"));
});

export const bulkAddQuestions = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const { sectionId, questionIds } = req.body;

  const result = await AssessmentQuestionService.bulkAddQuestions(
    organizationId,
    assessmentId,
    sectionId,
    questionIds || []
  );
  return res.status(201).json(new ApiResponse(201, result, "Questions added to assessment in bulk successfully"));
});
