import { AssessmentService } from "./assessment.service.js";
import { AssessmentValidator } from "./assessment.validator.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination, formatPaginatedResponse } from "../../utils/pagination.js";

export const createAssessment = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentValidator.validateCreate(req.body);
  if (!isValid) throw new ApiError(400, "Validation failed", errors);

  const organizationId = req.organizationId || req.user.organizationId;
  const assessment = await AssessmentService.createAssessment({
    organizationId,
    userId: req.user.id,
    data: req.body,
  });

  return res.status(201).json(new ApiResponse(201, assessment, "Assessment created successfully"));
});

export const getAssessmentById = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId || req.user.organizationId;
  const assessment = await AssessmentService.getAssessmentById(req.params.id, organizationId);
  return res.status(200).json(new ApiResponse(200, assessment, "Assessment retrieved"));
});

export const listAssessments = asyncHandler(async (req, res) => {
  const pagination = getPagination(req.query);
  const organizationId = req.organizationId || req.user.organizationId;

  const { items, total } = await AssessmentService.listAssessments(
    organizationId,
    {},
    pagination
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      formatPaginatedResponse({ data: items, total, page: pagination.page, limit: pagination.limit }),
      "Assessments retrieved"
    )
  );
});

export const updateAssessment = asyncHandler(async (req, res) => {
  const { isValid, errors } = AssessmentValidator.validateUpdate(req.body);
  if (!isValid) throw new ApiError(400, "Validation failed", errors);

  const organizationId = req.organizationId || req.user.organizationId;
  const updated = await AssessmentService.updateAssessment(req.params.id, organizationId, req.body);

  return res.status(200).json(new ApiResponse(200, updated, "Assessment updated successfully"));
});

export const publishAssessment = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId || req.user.organizationId;
  const published = await AssessmentService.publishAssessment(req.params.id, organizationId);
  return res.status(200).json(new ApiResponse(200, published, "Assessment published successfully"));
});

export const deleteAssessment = asyncHandler(async (req, res) => {
  const organizationId = req.organizationId || req.user.organizationId;
  const result = await AssessmentService.deleteAssessment(req.params.id, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Assessment deleted successfully"));
});
