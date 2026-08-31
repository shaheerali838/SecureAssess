import { InterviewService } from "./interview.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const createInterview = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;

  const result = await InterviewService.createInterview(
    organizationId,
    userId,
    req.body
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Interview scheduled successfully"));
});

export const getInterviews = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;

  const result = await InterviewService.getInterviews(
    organizationId,
    userId,
    false,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Interviews retrieved successfully"));
});

export const getMyInterviews = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;

  const result = await InterviewService.getInterviews(
    organizationId,
    userId,
    true,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Candidate interviews retrieved"));
});

export const getInterviewById = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { interviewId } = req.params;

  const isCandidate = req.user?.platformRole === "CANDIDATE" || !req.user?.memberships?.some(
    (m) => m.organizationId?.toString() === organizationId?.toString() && m.roleName !== "Candidate"
  );

  const result = await InterviewService.getInterviewById(
    organizationId,
    interviewId,
    userId,
    isCandidate
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Interview details retrieved"));
});

export const joinInterview = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { interviewId } = req.params;

  const isCandidate = req.user?.platformRole === "CANDIDATE" || !req.user?.memberships?.some(
    (m) => m.organizationId?.toString() === organizationId?.toString() && m.roleName !== "Candidate"
  );

  const result = await InterviewService.joinInterview(
    organizationId,
    interviewId,
    userId,
    isCandidate
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Interview session authorized"));
});

export const endInterview = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { interviewId } = req.params;

  const result = await InterviewService.endInterview(
    organizationId,
    interviewId,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Interview completed successfully"));
});

export const cancelInterview = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { interviewId } = req.params;
  const { reason } = req.body;

  const result = await InterviewService.cancelInterview(
    organizationId,
    interviewId,
    userId,
    reason
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Interview cancelled successfully"));
});

export const addParticipant = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { interviewId } = req.params;

  const result = await InterviewService.addParticipant(
    organizationId,
    interviewId,
    req.body
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Participant added successfully"));
});

export const removeParticipant = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { interviewId, userId } = req.params;

  const result = await InterviewService.removeParticipant(
    organizationId,
    interviewId,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Participant removed successfully"));
});

export const addNote = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { interviewId } = req.params;
  const userId = req.user?.id || req.user?._id;

  const result = await InterviewService.addNote(
    organizationId,
    interviewId,
    userId,
    req.body
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Interview note added successfully"));
});

export const getNotes = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const { interviewId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const isCandidate = Boolean(req.user?.role === "CANDIDATE" || req.path?.includes("candidate"));

  const result = await InterviewService.getNotes(
    organizationId,
    interviewId,
    userId,
    isCandidate
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Interview notes retrieved"));
});
