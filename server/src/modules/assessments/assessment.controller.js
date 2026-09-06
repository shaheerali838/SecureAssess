import mongoose from "mongoose";
import { AssessmentService } from "./assessment.service.js";
import { AssessmentValidator } from "./assessment.validation.js";
import Organization from "../organizations/organization.model.js";
import UserMembership from "../users/userMembership.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getOrgId = async (req) => {
  const rawOrgId =
    req.params.organizationId ||
    req.headers["x-organization-id"] ||
    req.headers["x-tenant-id"] ||
    req.query?.organizationId ||
    req.organizationId ||
    req.tenantId ||
    req.user?.activeOrganizationId ||
    req.user?.organizationId;

  if (rawOrgId && mongoose.Types.ObjectId.isValid(rawOrgId)) {
    return rawOrgId;
  }

  // Check user active membership
  const uId = req.user?._id || req.user?.id;
  if (uId) {
    const membership = await UserMembership.findOne({
      userId: uId,
      status: "ACTIVE",
    }).lean();
    if (membership?.organizationId) {
      return membership.organizationId;
    }
  }

  // Fallback to first existing organization in DB
  const firstOrg = await Organization.findOne({ status: { $ne: "DELETED" } }).select("_id").lean();
  return firstOrg?._id || null;
};

export const createAssessment = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = await getOrgId(req);
  if (!organizationId) {
    throw new ApiError(400, "No active organization context found to create assessment.");
  }

  const userId = req.user?.id || req.user?._id;
  const assessment = await AssessmentService.createAssessment(
    organizationId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, assessment, "Assessment created successfully"));
});

export const getAssessments = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const result = await AssessmentService.getAssessments(organizationId, req.query, req.user);
  return res.status(200).json(new ApiResponse(200, result, "Assessments retrieved successfully"));
});

export const getAssessment = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
  const assessment = await AssessmentService.getAssessment(organizationId, assessmentId, req.user);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment retrieved successfully"));
});

export const updateAssessment = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
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
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
  const result = await AssessmentService.deleteAssessment(organizationId, assessmentId);
  return res.status(200).json(new ApiResponse(200, result, "Assessment archived successfully"));
});

// Lifecycle Action Handlers
export const publishAssessment = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
  const userId = req.user?.id || req.user?._id;
  const assessment = await AssessmentService.publishAssessment(organizationId, assessmentId, userId);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment published successfully"));
});

export const archiveAssessment = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
  const userId = req.user?.id || req.user?._id;
  const assessment = await AssessmentService.archiveAssessment(organizationId, assessmentId, userId);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment archived"));
});

export const duplicateAssessment = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
  const userId = req.user?.id || req.user?._id;
  const assessment = await AssessmentService.duplicateAssessment(organizationId, assessmentId, userId);
  return res.status(201).json(new ApiResponse(201, assessment, "Assessment duplicated successfully"));
});

export const previewAssessment = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
  const result = await AssessmentService.previewAssessment(organizationId, assessmentId);
  return res.status(200).json(new ApiResponse(200, result, "Assessment preview generated"));
});

export const assignCandidates = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
  const userId = req.user?.id || req.user?._id;

  const result = await AssessmentService.assignCandidates(
    organizationId,
    assessmentId,
    req.body,
    userId
  );
  return res.status(200).json(new ApiResponse(200, result, "Candidates assigned successfully"));
});

export const getAssignments = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;

  const result = await AssessmentService.getAssignments(
    organizationId,
    assessmentId,
    req.query
  );
  return res.status(200).json(new ApiResponse(200, result, "Assessment assignments retrieved"));
});

export const removeAssignment = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const assessmentId = req.params.assessmentId || req.params.id;
  const { candidateId } = req.params;

  await AssessmentService.removeAssignment(organizationId, assessmentId, candidateId);
  return res.status(200).json(new ApiResponse(200, null, "Candidate assignment removed"));
});
