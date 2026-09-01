import mongoose from "mongoose";
import { ProctoringService } from "./proctoring.service.js";
import Organization from "../organizations/organization.model.js";
import UserMembership from "../users/userMembership.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

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

  const firstOrg = await Organization.findOne({ status: { $ne: "DELETED" } }).select("_id").lean();
  return firstOrg?._id || null;
};

export const startProctoring = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = await getOrgId(req);
  const clientIp = req.ip || req.headers["x-forwarded-for"] || "";

  const payload = {
    ...req.body,
    attemptId: req.params.attemptId || req.body.attemptId,
  };

  const result = await ProctoringService.startSession(
    userId,
    organizationId,
    payload,
    clientIp
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Proctoring session started successfully"));
});

export const recordEvent = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = await getOrgId(req);

  const payload = {
    ...req.body,
    sessionId: req.params.sessionId || req.body.sessionId || req.body.proctoringSessionId,
  };

  const result = await ProctoringService.recordEvent(
    userId,
    organizationId,
    payload
  );

  const statusCode = result.deduplicated ? 200 : 201;
  return res
    .status(statusCode)
    .json(
      new ApiResponse(
        statusCode,
        result,
        result.deduplicated
          ? "Duplicate event ignored"
          : "Proctoring event recorded successfully"
      )
    );
});

export const sendHeartbeat = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;

  const result = await ProctoringService.sendHeartbeat(
    userId,
    organizationId,
    sessionId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring heartbeat acknowledged"));
});

export const endProctoring = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;
  const { reason } = req.body;

  const result = await ProctoringService.endSession(
    userId,
    organizationId,
    sessionId,
    reason
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring session ended successfully"));
});

export const getSessionDetails = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;

  const result = await ProctoringService.getSessionDetails(
    organizationId,
    sessionId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring session details retrieved"));
});

export const getSessionEvents = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;

  const result = await ProctoringService.getSessionEvents(
    organizationId,
    sessionId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring events retrieved"));
});

export const getSessionTimeline = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;

  const result = await ProctoringService.getSessionTimeline(
    organizationId,
    sessionId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring timeline retrieved"));
});

export const sendWarning = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const warningMessage = req.body.warningMessage || req.body.message;

  const result = await ProctoringService.sendWarning(
    organizationId,
    sessionId,
    warningMessage,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Warning dispatched to candidate"));
});

export const pauseSession = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const { reason } = req.body;

  const result = await ProctoringService.pauseSession(
    organizationId,
    sessionId,
    reason,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring session paused"));
});

export const terminateSession = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const { reason } = req.body;

  const result = await ProctoringService.terminateSession(
    organizationId,
    sessionId,
    reason,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring session and attempt terminated"));
});

export const createEvidence = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;

  const result = await ProctoringService.createEvidence(
    organizationId,
    sessionId,
    req.body
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Evidence stored successfully"));
});

export const getSessionEvidence = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { sessionId } = req.params;

  const result = await ProctoringService.getSessionEvidence(
    organizationId,
    sessionId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Session evidence list retrieved"));
});

export const getEvidenceById = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const { evidenceId } = req.params;

  const result = await ProctoringService.getEvidenceById(
    organizationId,
    evidenceId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Evidence retrieved successfully"));
});

export const reviewEvent = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = await getOrgId(req);
  const { eventId } = req.params;

  const result = await ProctoringService.reviewEvent(
    organizationId,
    eventId,
    userId,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring event reviewed successfully"));
});

export const getSessions = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);

  const result = await ProctoringService.getSessions(organizationId, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring sessions retrieved successfully"));
});

export const getEvents = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);

  const result = await ProctoringService.getEvents(organizationId, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Proctoring events retrieved successfully"));
});

export const setIntegrityDecision = asyncHandler(async (req, res) => {
  const organizationId = await getOrgId(req);
  const targetId = req.params.sessionId || req.params.attemptId;
  const userId = req.user?.id || req.user?._id;
  const { decision, note } = req.body;

  const result = await ProctoringService.setIntegrityDecision(
    organizationId,
    targetId,
    decision,
    note,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Integrity decision updated successfully"));
});
