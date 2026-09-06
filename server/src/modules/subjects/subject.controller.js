import { SubjectService } from "./subject.service.js";
import { SubjectValidator } from "./subject.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getOrgId = (req) =>
  req.params.organizationId ||
  req.organizationId ||
  req.tenantId ||
  req.user?.activeOrganizationId ||
  req.user?.organizationId;

export const createSubject = asyncHandler(async (req, res) => {
  const { isValid, errors } = SubjectValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = getOrgId(req);
  const subject = await SubjectService.createSubject(organizationId, req.body);
  return res.status(201).json(new ApiResponse(201, subject, "Subject created successfully"));
});

export const getSubjects = asyncHandler(async (req, res) => {
  const organizationId = getOrgId(req);
  const result = await SubjectService.getSubjects(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Subjects retrieved successfully"));
});

export const getSubject = asyncHandler(async (req, res) => {
  const organizationId = getOrgId(req);
  const { subjectId } = req.params;
  const subject = await SubjectService.getSubject(organizationId, subjectId);
  return res.status(200).json(new ApiResponse(200, subject, "Subject retrieved successfully"));
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { isValid, errors } = SubjectValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = getOrgId(req);
  const { subjectId } = req.params;
  const subject = await SubjectService.updateSubject(organizationId, subjectId, req.body);
  return res.status(200).json(new ApiResponse(200, subject, "Subject updated successfully"));
});

export const updateSubjectStatus = asyncHandler(async (req, res) => {
  const { isValid, errors } = SubjectValidator.validateStatusUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = getOrgId(req);
  const { subjectId } = req.params;
  const subject = await SubjectService.updateSubjectStatus(
    organizationId,
    subjectId,
    req.body.status
  );
  return res.status(200).json(new ApiResponse(200, subject, `Subject status updated to '${req.body.status}'`));
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const organizationId = getOrgId(req);
  const { subjectId } = req.params;
  const result = await SubjectService.deleteSubject(organizationId, subjectId);
  return res.status(200).json(new ApiResponse(200, result, "Subject archived successfully"));
});
