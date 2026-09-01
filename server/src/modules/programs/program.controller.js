import { ProgramService } from "./program.service.js";
import { ProgramValidator } from "./program.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

const getOrgId = (req) =>
  req.params.organizationId ||
  req.organizationId ||
  req.tenantId ||
  req.user?.activeOrganizationId ||
  req.user?.organizationId;

export const createProgram = asyncHandler(async (req, res) => {
  const { isValid, errors } = ProgramValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = getOrgId(req);
  const program = await ProgramService.createProgram(organizationId, req.body);
  return res.status(201).json(new ApiResponse(201, program, "Program created successfully"));
});

export const getPrograms = asyncHandler(async (req, res) => {
  const organizationId = getOrgId(req);
  const result = await ProgramService.getPrograms(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Programs retrieved successfully"));
});

export const getProgram = asyncHandler(async (req, res) => {
  const organizationId = getOrgId(req);
  const { programId } = req.params;
  const program = await ProgramService.getProgram(organizationId, programId);
  return res.status(200).json(new ApiResponse(200, program, "Program retrieved successfully"));
});

export const updateProgram = asyncHandler(async (req, res) => {
  const { isValid, errors } = ProgramValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = getOrgId(req);
  const { programId } = req.params;
  const program = await ProgramService.updateProgram(organizationId, programId, req.body);
  return res.status(200).json(new ApiResponse(200, program, "Program updated successfully"));
});

export const updateProgramStatus = asyncHandler(async (req, res) => {
  const { isValid, errors } = ProgramValidator.validateStatusUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = getOrgId(req);
  const { programId } = req.params;
  const program = await ProgramService.updateProgramStatus(
    organizationId,
    programId,
    req.body.status
  );
  return res.status(200).json(new ApiResponse(200, program, `Program status updated to '${req.body.status}'`));
});

export const deleteProgram = asyncHandler(async (req, res) => {
  const organizationId = getOrgId(req);
  const { programId } = req.params;
  const result = await ProgramService.deleteProgram(organizationId, programId);
  return res.status(200).json(new ApiResponse(200, result, "Program archived successfully"));
});
