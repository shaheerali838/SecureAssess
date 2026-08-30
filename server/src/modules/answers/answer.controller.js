import { AnswerService } from "./answer.service.js";
import { AnswerValidator } from "./answer.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const saveAnswer = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId, attemptQuestionId } = req.params;

  const answerPayload = req.body.answer || req.body;
  const result = await AnswerService.saveAnswer(
    userId,
    organizationId,
    attemptId,
    attemptQuestionId,
    answerPayload
  );

  return res.status(200).json(new ApiResponse(200, result, "Answer saved successfully"));
});

export const getAnswers = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;

  const result = await AnswerService.getAnswers(userId, organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, result, "Answers retrieved successfully"));
});

export const getQuestionAndAnswer = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId, attemptQuestionId } = req.params;

  const result = await AnswerService.getQuestionAndAnswer(
    userId,
    organizationId,
    attemptId,
    attemptQuestionId
  );
  return res.status(200).json(new ApiResponse(200, result, "Question and answer retrieved successfully"));
});

export const updateCurrentQuestion = asyncHandler(async (req, res) => {
  const { isValid, errors } = AnswerValidator.validateNavigation(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;

  const result = await AnswerService.updateCurrentQuestion(
    userId,
    organizationId,
    attemptId,
    req.body.questionIndex
  );

  return res.status(200).json(new ApiResponse(200, result, "Current question updated successfully"));
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;

  const result = await AnswerService.submitAttempt(userId, organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});
