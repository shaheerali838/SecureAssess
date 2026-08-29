import { EvaluationService } from "./evaluation.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const evaluateAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await EvaluationService.evaluateAttempt(attemptId, { evaluatorUserId: userId });
  return res.status(200).json(new ApiResponse(200, result, "Attempt evaluated successfully"));
});

export const getPendingEvaluations = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const result = await EvaluationService.getPendingEvaluations(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Pending evaluations retrieved"));
});

export const getEvaluationById = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const { evaluationId } = req.params;
  const result = await EvaluationService.getEvaluationById(organizationId, evaluationId);
  return res.status(200).json(new ApiResponse(200, result, "Evaluation retrieved successfully"));
});

export const gradeQuestion = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const { evaluationId, questionId } = req.params;
  const userId = req.user?.id || req.user?._id;

  const result = await EvaluationService.gradeQuestion(
    organizationId,
    evaluationId,
    questionId,
    req.body,
    userId
  );
  return res.status(200).json(new ApiResponse(200, result, "Question graded successfully"));
});

export const finalizeEvaluation = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const { evaluationId } = req.params;
  const userId = req.user?.id || req.user?._id;

  const result = await EvaluationService.finalizeEvaluation(organizationId, evaluationId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Evaluation finalized successfully"));
});

export const recalculateEvaluation = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const { evaluationId } = req.params;
  const userId = req.user?.id || req.user?._id;

  const result = await EvaluationService.recalculateEvaluation(organizationId, evaluationId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Evaluation recalculated"));
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
  const organizationId = req.params.organizationId || req.organizationId || req.query.organizationId;
  const { attemptId } = req.params;

  const result = await EvaluationService.getCandidateResult(userId, organizationId, attemptId);
  return res.status(200).json(new ApiResponse(200, result, "Result retrieved successfully"));
});
