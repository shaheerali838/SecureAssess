import { AttemptService } from "./attempt.service.js";
import { AttemptValidator } from "./attempt.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const startAttempt = asyncHandler(async (req, res) => {
  const { isValid, errors } = AttemptValidator.validateStart(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { assignmentId } = req.params;

  const clientInfo = {
    ip: req.ip || req.headers["x-forwarded-for"] || "",
    userAgent: req.headers["user-agent"] || "",
  };

  const result = await AttemptService.startAttempt(
    userId,
    organizationId,
    assignmentId,
    clientInfo
  );

  return res.status(201).json(new ApiResponse(201, result, "Attempt started successfully"));
});

export const getAttempt = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;

  const result = await AttemptService.getAttempt(userId, organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, result, "Attempt details retrieved successfully"));
});

export const getAttemptQuestions = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;

  const questions = await AttemptService.getAttemptQuestions(userId, organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, questions, "Attempt questions retrieved successfully"));
});

export const getAttemptQuestion = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId, attemptQuestionId } = req.params;

  const question = await AttemptService.getAttemptQuestion(
    userId,
    organizationId,
    attemptId,
    attemptQuestionId
  );
  return res.status(200).json(new ApiResponse(200, question, "Attempt question retrieved successfully"));
});

export const heartbeat = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;

  const result = await AttemptService.heartbeat(userId, organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, result, "Heartbeat recorded"));
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;

  const result = await AttemptService.submitAttempt(userId, organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});
