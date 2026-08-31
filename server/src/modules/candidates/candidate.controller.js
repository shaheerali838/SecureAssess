import { CandidateService } from "./candidate.service.js";
import { CandidateValidator } from "./candidate.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

// ==========================================
// ORGANIZATION CANDIDATE MANAGEMENT HANDLERS
// ==========================================

export const createCandidate = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateValidator.validateCreate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId || req.organizationId;
  const actorUserId = req.user?.id || req.user?._id;
  const candidate = await CandidateService.createCandidate(organizationId, req.body, actorUserId);
  return res.status(201).json(new ApiResponse(201, candidate, "Candidate profile created successfully"));
});

export const getCandidates = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const result = await CandidateService.getCandidates(organizationId, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Candidates retrieved successfully"));
});

export const getCandidate = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { candidateId } = req.params;
  const candidate = await CandidateService.getCandidate(organizationId, candidateId);
  return res.status(200).json(new ApiResponse(200, candidate, "Candidate retrieved successfully"));
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateValidator.validateUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId || req.organizationId;
  const { candidateId } = req.params;
  const actorUserId = req.user?.id || req.user?._id;
  const candidate = await CandidateService.updateCandidate(organizationId, candidateId, req.body, actorUserId);
  return res.status(200).json(new ApiResponse(200, candidate, "Candidate updated successfully"));
});

export const updateCandidateStatus = asyncHandler(async (req, res) => {
  const { isValid, errors } = CandidateValidator.validateStatusUpdate(req.body);
  if (!isValid) {
    throw new ApiError(400, "Validation failed", errors);
  }

  const organizationId = req.params.organizationId || req.organizationId;
  const { candidateId } = req.params;
  const actorUserId = req.user?.id || req.user?._id;
  const candidate = await CandidateService.updateCandidateStatus(
    organizationId,
    candidateId,
    req.body.status,
    actorUserId
  );
  return res.status(200).json(new ApiResponse(200, candidate, `Candidate status updated to '${req.body.status}'`));
});

export const suspendCandidate = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { candidateId } = req.params;
  const actorUserId = req.user?.id || req.user?._id;
  const candidate = await CandidateService.updateCandidateStatus(
    organizationId,
    candidateId,
    "SUSPENDED",
    actorUserId
  );
  return res.status(200).json(new ApiResponse(200, candidate, "Candidate suspended successfully"));
});

export const activateCandidate = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { candidateId } = req.params;
  const actorUserId = req.user?.id || req.user?._id;
  const candidate = await CandidateService.updateCandidateStatus(
    organizationId,
    candidateId,
    "ACTIVE",
    actorUserId
  );
  return res.status(200).json(new ApiResponse(200, candidate, "Candidate activated successfully"));
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { candidateId } = req.params;
  const actorUserId = req.user?.id || req.user?._id;
  const result = await CandidateService.deleteCandidate(organizationId, candidateId, actorUserId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate deactivated successfully"));
});

export const inviteCandidate = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { candidateId } = req.params;
  const actorUserId = req.user?.id || req.user?._id;
  const result = await CandidateService.inviteCandidate(organizationId, candidateId, actorUserId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate invitation generated successfully"));
});

export const activateCandidateAccount = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const result = await CandidateService.activateCandidateByToken(token, password);
  return res.status(200).json(new ApiResponse(200, result, "Candidate account activated successfully"));
});

export const bulkImportCandidates = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const actorUserId = req.user?.id || req.user?._id;
  const { items } = req.body;

  const { isValid, errors } = CandidateValidator.validateBulkImport(items);
  if (!isValid) {
    throw new ApiError(400, "Bulk validation failed", errors);
  }

  const result = await CandidateService.bulkImportCandidates(organizationId, items, actorUserId);
  return res.status(200).json(new ApiResponse(200, result, "Bulk candidate import processed"));
});

// ==========================================
// CANDIDATE PORTAL SELF-SERVICE HANDLERS
// ==========================================

export const getCandidatePortalProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.query.organizationId || null;
  const result = await CandidateService.getCandidatePortalProfile(userId, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate profile retrieved"));
});

export const updateCandidatePortalProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.body.organizationId || null;
  const result = await CandidateService.updateCandidatePortalProfile(userId, organizationId, req.body);
  return res.status(200).json(new ApiResponse(200, result, "Candidate profile updated"));
});

export const getCandidatePortalAssignments = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.query.organizationId || null;
  const result = await CandidateService.getCandidatePortalAssignments(userId, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate assignments retrieved"));
});

export const getCandidatePortalAssignmentById = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { id } = req.params;
  const organizationId = req.organizationId || req.query.organizationId || null;
  const result = await CandidateService.getCandidatePortalAssignmentById(userId, id, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate assignment retrieved"));
});

export const getCandidatePortalAttempts = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.query.organizationId || null;
  const result = await CandidateService.getCandidatePortalAttempts(userId, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate attempts retrieved"));
});

export const getCandidatePortalResults = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.query.organizationId || null;
  const result = await CandidateService.getCandidatePortalResults(userId, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate results retrieved"));
});

export const getCandidatePortalCertificates = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.query.organizationId || null;
  const result = await CandidateService.getCandidatePortalCertificates(userId, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate certificates retrieved"));
});

export const getCandidatePortalInterviews = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.organizationId || req.query.organizationId || null;
  const result = await CandidateService.getCandidatePortalInterviews(userId, organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Candidate interviews retrieved"));
});
