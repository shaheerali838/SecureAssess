import { AttemptService } from "./attempt.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const startAttempt = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId || req.body.organizationId;
  const assignmentId = req.params.assignmentId || req.body.assignmentId;

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

export const getAttempts = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;

  const result = await AttemptService.getAttempts(userId, organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Candidate attempts retrieved"));
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
  const { attemptId, questionId } = req.params;
  const targetQId = questionId || req.params.attemptQuestionId;

  const question = await AttemptService.getAttemptQuestion(
    userId,
    organizationId,
    attemptId,
    targetQId
  );
  return res.status(200).json(new ApiResponse(200, question, "Attempt question retrieved successfully"));
});

export const saveAnswer = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId, questionId } = req.params;
  const targetQId = questionId || req.params.attemptQuestionId;

  const result = await AttemptService.saveAnswer(
    userId,
    organizationId,
    attemptId,
    targetQId,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, result, "Answer saved successfully"));
});

export const flagQuestion = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId, questionId } = req.params;
  const targetQId = questionId || req.params.attemptQuestionId;
  const { flagged } = req.body;

  const result = await AttemptService.flagQuestion(
    userId,
    organizationId,
    attemptId,
    targetQId,
    flagged !== undefined ? flagged : true
  );
  return res.status(200).json(new ApiResponse(200, result, "Question flag updated"));
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

export const terminateAttempt = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;
  const { reason } = req.body;

  const result = await AttemptService.terminateAttempt(userId, organizationId, attemptId, reason);
  return res.status(200).json(new ApiResponse(200, result, "Attempt terminated"));
});
