import { AssessmentSectionService } from "./assessmentSection.service.js";
import { AssessmentSectionValidator } from "./assessmentSection.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createSection = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentSectionValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, assessmentId } = req.params;
  const section = await AssessmentSectionService.createSection(
    organizationId,
    assessmentId,
    req.body
  );
  return res.status(201).json(new ApiResponse(201, section, "Assessment section created successfully"));
});

export const getSections = asyncHandler(async (req, res) => {
  const { organizationId, assessmentId } = req.params;
  const sections = await AssessmentSectionService.getSections(organizationId, assessmentId);
  return res.status(200).json(new ApiResponse(200, sections, "Sections retrieved successfully"));
});

export const updateSection = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentSectionValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, assessmentId, sectionId } = req.params;
  const section = await AssessmentSectionService.updateSection(
    organizationId,
    assessmentId,
    sectionId,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, section, "Section updated successfully"));
});

export const deleteSection = asyncHandler(async (req, res) => {
  const { organizationId, assessmentId, sectionId } = req.params;
  const result = await AssessmentSectionService.deleteSection(
    organizationId,
    assessmentId,
    sectionId
  );
  return res.status(200).json(new ApiResponse(200, result, "Section deleted successfully"));
});
