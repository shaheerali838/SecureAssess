import { ResultService } from "./result.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const generateResult = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { evaluationId } = req.params;
  const userId = req.user?.id || req.user?._id;

  const result = await ResultService.generateResult(organizationId, evaluationId, userId);
  return res.status(201).json(new ApiResponse(201, result, "Result generated successfully"));
});

export const getMyResults = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.query.organizationId || null;

  const result = await ResultService.getMyResults(userId, organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Candidate results retrieved"));
});

export const getCandidateResult = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.query.organizationId || null;
  const { resultId } = req.params;

  const result = await ResultService.getCandidateResult(userId, organizationId, resultId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate result details retrieved"));
});

export const getResults = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const result = await ResultService.getResults(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Results retrieved successfully"));
});

export const getResultById = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { resultId } = req.params;

  const result = await ResultService.getResultById(organizationId, resultId);
  return res.status(200).json(new ApiResponse(200, result, "Result details retrieved"));
});

export const publishResult = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { resultId } = req.params;
  const userId = req.user?.id || req.user?._id;

  const result = await ResultService.publishResult(organizationId, resultId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Result published successfully"));
});

export const unpublishResult = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { resultId } = req.params;
  const userId = req.user?.id || req.user?._id;

  const result = await ResultService.unpublishResult(organizationId, resultId, userId, req.body?.reason);
  return res.status(200).json(new ApiResponse(200, result, "Result unpublished successfully"));
});

export const voidResult = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { resultId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const reason = req.body?.reason || "Examination irregularity";

  const result = await ResultService.voidResult(organizationId, resultId, userId, reason);
  return res.status(200).json(new ApiResponse(200, result, "Result voided successfully"));
});

export const correctResult = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { resultId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const reason = req.body?.reason || "Examiner score correction";

  const result = await ResultService.correctResult(organizationId, resultId, req.body, userId, reason);
  return res.status(200).json(new ApiResponse(200, result, "Result corrected successfully"));
});
