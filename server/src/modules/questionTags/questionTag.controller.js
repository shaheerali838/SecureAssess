import { QuestionTagService } from "./questionTag.service.js";
import { QuestionTagValidator } from "./questionTag.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createTag = asyncHandler(async (req, res) => {
  const { isValid, errors } = QuestionTagValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId;
  const userId = req.user?.id || req.user?._id;
  const tag = await QuestionTagService.createTag(organizationId, req.body, userId);
  return res.status(201).json(new ApiResponse(201, tag, "Question tag created successfully"));
});

export const getTags = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const result = await QuestionTagService.getTags(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Question tags retrieved successfully"));
});

export const getTag = asyncHandler(async (req, res) => {
  const { organizationId, tagId } = req.params;
  const tag = await QuestionTagService.getTag(organizationId, tagId);
  return res.status(200).json(new ApiResponse(200, tag, "Question tag retrieved successfully"));
});

export const updateTag = asyncHandler(async (req, res) => {
  const { isValid, errors } = QuestionTagValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, tagId } = req.params;
  const tag = await QuestionTagService.updateTag(organizationId, tagId, req.body);
  return res.status(200).json(new ApiResponse(200, tag, "Question tag updated successfully"));
});

export const deleteTag = asyncHandler(async (req, res) => {
  const { organizationId, tagId } = req.params;
  const result = await QuestionTagService.deleteTag(organizationId, tagId);
  return res.status(200).json(new ApiResponse(200, result, "Question tag deleted successfully"));
});
