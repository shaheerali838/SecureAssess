import { CandidateService } from "./candidate.service.js";
import { CandidateValidator } from "./candidate.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createCandidate = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId;
  const candidate = await CandidateService.createCandidate(organizationId, req.body);
  return res.status(201).json(new ApiResponse(201, candidate, "Candidate profile created successfully"));
});

export const getCandidates = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId;
  const result = await CandidateService.getCandidates(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Candidates retrieved successfully"));
});

export const getCandidate = asyncHandler(async (req, res) => {
  const { organizationId, candidateId } = req.params;
  const candidate = await CandidateService.getCandidate(organizationId, candidateId);
  return res.status(200).json(new ApiResponse(200, candidate, "Candidate retrieved successfully"));
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, candidateId } = req.params;
  const candidate = await CandidateService.updateCandidate(organizationId, candidateId, req.body);
  return res.status(200).json(new ApiResponse(200, candidate, "Candidate updated successfully"));
});

export const updateCandidateStatus = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateValidator.validateStatusUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const { organizationId, candidateId } = req.params;
  const candidate = await CandidateService.updateCandidateStatus(
    organizationId,
    candidateId,
    req.body.status
  );
  return res.status(200).json(new ApiResponse(200, candidate, `Candidate status updated to '${req.body.status}'`));
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const { organizationId, candidateId } = req.params;
  const result = await CandidateService.deleteCandidate(organizationId, candidateId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate deactivated successfully"));
});
