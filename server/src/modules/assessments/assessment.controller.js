import { AssessmentService } from "./assessment.service.js";
import { AssessmentValidator } from "./assessment.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createAssessment = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId || req.organizationId;
  const userId = req.user?.id || req.user?._id;
  const assessment = await AssessmentService.createAssessment(
    organizationId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, assessment, "Assessment created successfully"));
});

export const getAssessments = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const result = await AssessmentService.getAssessments(organizationId, req.query, req);
  return res.status(200).json(new ApiResponse(200, result, "Assessments retrieved successfully"));
});

export const getAssessment = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const assessment = await AssessmentService.getAssessment(organizationId, assessmentId, req);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment retrieved successfully"));
});

export const updateAssessment = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const assessment = await AssessmentService.updateAssessment(
    organizationId,
    assessmentId,
    req.body,
    userId
  );
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment updated successfully"));
});

export const deleteAssessment = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const result = await AssessmentService.deleteAssessment(organizationId, assessmentId);
  return res.status(200).json(new ApiResponse(200, result, "Assessment archived successfully"));
});

// Lifecycle Action Handlers
export const submitForReview = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const assessment = await AssessmentService.submitForReview(organizationId, assessmentId, req);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment submitted for review"));
});

export const approveAssessment = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const assessment = await AssessmentService.approveAssessment(organizationId, assessmentId, req);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment approved"));
});

export const publishAssessment = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const assessment = await AssessmentService.publishAssessment(organizationId, assessmentId, req);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment published successfully"));
});

export const closeAssessment = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const assessment = await AssessmentService.closeAssessment(organizationId, assessmentId, req);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment closed"));
});

export const archiveAssessment = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { assessmentId } = req.params;
  const assessment = await AssessmentService.archiveAssessment(organizationId, assessmentId, req);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment archived"));
});
