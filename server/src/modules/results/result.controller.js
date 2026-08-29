import { ResultService } from "./result.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getMyResults = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const result = await ResultService.getMyResults(userId, organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Candidate results retrieved"));
});

export const getResultById = asyncHandler(async (req, res) => {
  const { resultId } = req.params;
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const result = await ResultService.getResultById(resultId, req.user, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Result details retrieved"));
});

export const getResults = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const result = await ResultService.getResults(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Results retrieved successfully"));
});

export const getAssessmentResults = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const { assessmentId } = req.params;
  const result = await ResultService.getAssessmentResults(organizationId, assessmentId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Assessment results retrieved"));
});

export const publishResult = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  const { resultId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await ResultService.publishResult(organizationId, resultId, userId);
  return res.status(200).json(new ApiResponse(200, result, "Result published successfully"));
});
