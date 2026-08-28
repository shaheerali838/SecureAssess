import { CandidateGroupService } from "./candidateGroup.service.js";
import { CandidateGroupValidator } from "./candidateGroup.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createGroup = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateGroupValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId;
  const userId = req.user?.id || req.user?._id;
  const group = await CandidateGroupService.createGroup(organizationId, req.body, userId);
  return res.status(201).json(new ApiResponse(201, group, "Candidate group created successfully"));
});

export const getGroups = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const result = await CandidateGroupService.getGroups(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Candidate groups retrieved successfully"));
});

export const getGroup = asyncHandler(async (req, res) => {
  const { organizationId, groupId } = req.params;
  const group = await CandidateGroupService.getGroup(organizationId, groupId);
  return res.status(200).json(new ApiResponse(200, group, "Candidate group retrieved successfully"));
});

export const updateGroup = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateGroupValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, groupId } = req.params;
  const group = await CandidateGroupService.updateGroup(organizationId, groupId, req.body);
  return res.status(200).json(new ApiResponse(200, group, "Candidate group updated successfully"));
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const { organizationId, groupId } = req.params;
  const result = await CandidateGroupService.deleteGroup(organizationId, groupId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate group archived successfully"));
});

export const addMember = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateGroupValidator.validateMember(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, groupId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const member = await CandidateGroupService.addMemberToGroup(
    organizationId,
    groupId,
    req.body.candidateId,
    userId
  );
  return res.status(201).json(new ApiResponse(201, member, "Candidate added to group successfully"));
});

export const removeMember = asyncHandler(async (req, res) => {
  const { organizationId, groupId, candidateId } = req.params;
  const result = await CandidateGroupService.removeMemberFromGroup(
    organizationId,
    groupId,
    candidateId
  );
  return res.status(200).json(new ApiResponse(200, result, "Candidate removed from group successfully"));
});

export const getGroupMembers = asyncHandler(async (req, res) => {
  const { organizationId, groupId } = req.params;
  const result = await CandidateGroupService.getGroupMembers(organizationId, groupId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Group members retrieved successfully"));
});
