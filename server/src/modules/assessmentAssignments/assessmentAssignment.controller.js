import { AssessmentAssignmentService } from "./assessmentAssignment.service.js";
import { AssessmentAssignmentValidator } from "./assessmentAssignment.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createAssignments = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentAssignmentValidator.validateIndividual(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, assessmentId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await AssessmentAssignmentService.createAssignments(
    organizationId,
    assessmentId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, result, "Assessment assigned to candidates successfully"));
});

export const createGroupAssignment = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentAssignmentValidator.validateGroup(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, assessmentId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await AssessmentAssignmentService.createGroupAssignment(
    organizationId,
    assessmentId,
    req.body,
    userId
  );
  return res.status(201).json(new ApiResponse(201, result, "Assessment assigned to candidate group successfully"));
});

export const getAssignments = asyncHandler(async (req, res) => {
  const { organizationId, assessmentId } = req.params;
  const result = await AssessmentAssignmentService.getAssignments(
    organizationId,
    assessmentId,
    req.query
  );
  return res.status(200).json(new ApiResponse(200, result, "Assignments retrieved successfully"));
});

export const getAssignmentById = asyncHandler(async (req, res) => {
  const { organizationId, assignmentId } = req.params;
  const assignment = await AssessmentAssignmentService.getAssignmentById(
    organizationId,
    assignmentId
  );
  return res.status(200).json(new ApiResponse(200, assignment, "Assignment retrieved successfully"));
});

export const revokeAssignment = asyncHandler(async (req, res) => {
  const { organizationId, assignmentId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const assignment = await AssessmentAssignmentService.revokeAssignment(
    organizationId,
    assignmentId,
    userId
  );
  return res.status(200).json(new ApiResponse(200, assignment, "Assignment revoked successfully"));
});

/**
 * Candidate View & Candidate Authorization Endpoints
 */
export const getMyAssignments = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const assignments = await AssessmentAssignmentService.getCandidateAssignments(
    userId,
    organizationId
  );
  return res.status(200).json(new ApiResponse(200, assignments, "Candidate assignments retrieved successfully"));
});

export const getMyAssessment = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { organizationId, assessmentId } = req.params;
  const result = await AssessmentAssignmentService.getAuthorizedAssessmentForCandidate(
    userId,
    organizationId,
    assessmentId
  );
  return res.status(200).json(new ApiResponse(200, result, "Authorized assessment retrieved successfully"));
});
