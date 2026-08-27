import { QuestionBankService } from "./questionBank.service.js";
import { QuestionBankValidator } from "./questionBank.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Question Bank Handlers
 */
export const createQuestionBank = asyncHandler(async (req, res) => {
  const { isValid, errors } = QuestionBankValidator.validateQuestionBank(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId;
  const userId = req.user?.id || req.user?._id;
  const questionBank = await QuestionBankService.createQuestionBank(
    organizationId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, questionBank, "Question bank created successfully"));
});

export const getQuestionBanks = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const result = await QuestionBankService.getQuestionBanks(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Question banks retrieved successfully"));
});

export const getQuestionBank = asyncHandler(async (req, res) => {
  const { organizationId, questionBankId } = req.params;
  const questionBank = await QuestionBankService.getQuestionBank(organizationId, questionBankId);
  return res.status(200).json(new ApiResponse(200, questionBank, "Question bank retrieved successfully"));
});

export const updateQuestionBank = asyncHandler(async (req, res) => {
  const { organizationId, questionBankId } = req.params;
  const questionBank = await QuestionBankService.updateQuestionBank(
    organizationId,
    questionBankId,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, questionBank, "Question bank updated successfully"));
});

export const deleteQuestionBank = asyncHandler(async (req, res) => {
  const { organizationId, questionBankId } = req.params;
  const result = await QuestionBankService.deleteQuestionBank(organizationId, questionBankId);
  return res.status(200).json(new ApiResponse(200, result, "Question bank archived successfully"));
});

/**
 * Question Handlers
 */
export const createQuestion = asyncHandler(async (req, res) => {
  const { isValid, errors } = QuestionBankValidator.validateQuestion(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, questionBankId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const question = await QuestionBankService.createQuestion(
    organizationId,
    questionBankId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, question, "Question created successfully"));
});

export const getQuestions = asyncHandler(async (req, res) => {
  const { organizationId, questionBankId } = req.params;
  const result = await QuestionBankService.getQuestions(
    organizationId,
    questionBankId,
    req.query,
    req
  );
  return res.status(200).json(new ApiResponse(200, result, "Questions retrieved successfully"));
});

export const getQuestion = asyncHandler(async (req, res) => {
  const { organizationId, questionBankId, questionId } = req.params;
  const question = await QuestionBankService.getQuestion(
    organizationId,
    questionBankId,
    questionId,
    req
  );
  return res.status(200).json(new ApiResponse(200, question, "Question retrieved successfully"));
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const { organizationId, questionBankId, questionId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const question = await QuestionBankService.updateQuestion(
    organizationId,
    questionBankId,
    questionId,
    req.body,
    userId
  );
  return res.status(200).json(new ApiResponse(200, question, "Question updated successfully"));
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const { organizationId, questionBankId, questionId } = req.params;
  const result = await QuestionBankService.deleteQuestion(
    organizationId,
    questionBankId,
    questionId
  );
  return res.status(200).json(new ApiResponse(200, result, "Question archived successfully"));
});
