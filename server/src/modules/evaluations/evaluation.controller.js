import { EvaluationService } from "./evaluation.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const evaluateAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const result = await EvaluationService.evaluateAttempt(attemptId);
  return res.status(200).json(new ApiResponse(200, result, "Attempt evaluated successfully"));
});

export const regradeAttempt = asyncHandler(async (req, res) => {
  const { organizationId, attemptId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await EvaluationService.regradeAttempt(organizationId, attemptId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Attempt regraded successfully"));
});

export const publishResult = asyncHandler(async (req, res) => {
  const { organizationId, attemptId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await EvaluationService.publishResult(organizationId, attemptId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Result published successfully"));
});

export const getEvaluationDetails = asyncHandler(async (req, res) => {
  const { organizationId, attemptId } = req.params;
  const result = await EvaluationService.getEvaluationDetails(organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, result, "Evaluation details retrieved successfully"));
});

export const getCandidateResult = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { attemptId } = req.params;

  const result = await EvaluationService.getCandidateResult(userId, organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, result, "Result retrieved successfully"));
});
