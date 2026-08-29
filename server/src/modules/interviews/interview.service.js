import mongoose from "mongoose";
import Interview from "./interview.model.js";
import InterviewParticipant from "./interviewParticipant.model.js";
import InterviewSession from "./interviewSession.model.js";
import InterviewEvent from "./interviewEvent.model.js";
import Candidate from "../candidates/candidate.model.js";
import User from "../users/user.model.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import {
  INTERVIEW_STATUSES,
  PARTICIPANT_ROLES,
  PARTICIPANT_STATUSES,
  SESSION_STATUSES,
  INTERVIEW_EVENT_TYPES,
} from "./interview.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import crypto from "crypto";

export class InterviewService {
  /**
   * Schedules a new interview and registers initial participants
   */
  static async createInterview(organizationId, createdByUserId, data) {
    const {
      title,
      description,
      type,
      scheduledStartAt,
      scheduledEndAt,
      candidateId,
      assessmentId,
      interviewerUserIds = [],
      settings = {},
    } = data;

    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      throw new ApiError(400, "Invalid candidate ID");
    }

    const candidate = await Candidate.findOne({ _id: candidateId, organizationId });
    if (!candidate) {
      throw new ApiError(404, "Candidate not found in this organization");
    }

    const interview = await Interview.create({
      organizationId,
      title,
      description,
      type: type || "TECHNICAL",
      status: INTERVIEW_STATUSES.SCHEDULED,
      scheduledStartAt: new Date(scheduledStartAt),
      scheduledEndAt: new Date(scheduledEndAt),
      createdBy: createdByUserId,
      assessmentId: assessmentId || null,
      candidateId: candidate._id,
      settings,
    });

    // Register Candidate as Participant
    if (candidate.userId) {
      await InterviewParticipant.create({
        interviewId: interview._id,
        userId: candidate.userId,
        organizationId,
        role: PARTICIPANT_ROLES.CANDIDATE,
        status: PARTICIPANT_STATUSES.INVITED,
      });

      // Send Notification to candidate
      await NotificationService.notify({
        organizationId,
        recipientId: candidate.userId,
        type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
        data: {
          interviewId: interview._id,
          interviewTitle: title,
          interviewDate: new Date(scheduledStartAt).toLocaleDateString(),
          interviewTime: new Date(scheduledStartAt).toLocaleTimeString(),
          interviewType: type || "TECHNICAL",
        },
      });
    }

    // Register Interviewer(s)
    const allInterviewers = new Set([
      createdByUserId.toString(),
      ...interviewerUserIds.map((id) => id.toString()),
    ]);

    for (const intUserId of allInterviewers) {
      if (mongoose.Types.ObjectId.isValid(intUserId)) {
        await InterviewParticipant.findOneAndUpdate(
          { interviewId: interview._id, userId: intUserId },
          {
            interviewId: interview._id,
            userId: intUserId,
            organizationId,
            role: PARTICIPANT_ROLES.INTERVIEWER,
            status: PARTICIPANT_STATUSES.INVITED,
          },
          { upsert: true, new: true }
        );

        if (intUserId !== createdByUserId.toString()) {
          await NotificationService.notify({
            organizationId,
            recipientId: intUserId,
            type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
            data: {
              interviewId: interview._id,
              interviewTitle: title,
              interviewDate: new Date(scheduledStartAt).toLocaleDateString(),
              interviewTime: new Date(scheduledStartAt).toLocaleTimeString(),
            },
          });
        }
      }
    }

    // Audit Event
    await InterviewEvent.create({
      interviewId: interview._id,
      organizationId,
      userId: createdByUserId,
      type: INTERVIEW_EVENT_TYPES.INTERVIEW_CREATED,
      data: { title, scheduledStartAt },
    });

    return interview;
  }

  /**
   * Retrieves interviews for an organization or candidate
   */
  static async getInterviews(organizationId, userId, isCandidate = false, query = {}) {
    const filter = { organizationId };

    if (isCandidate) {
      const candidate = await Candidate.findOne({ organizationId, userId });
      if (!candidate) return { items: [], pagination: { total: 0 } };
      filter.candidateId = candidate._id;
    }

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Interview.find(filter)
        .populate("candidateId", "firstName lastName email candidateCode")
        .populate("createdBy", "firstName lastName email")
        .populate("assessmentId", "title code")
        .sort({ scheduledStartAt: -1 })
        .skip(skip)
        .limit(limit),
      Interview.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves detailed interview record
   */
  static async getInterviewById(organizationId, interviewId, userId, isCandidate = false) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID format");
    }

    const interview = await Interview.findOne({ _id: interviewId, organizationId })
      .populate("candidateId", "firstName lastName email candidateCode userId")
      .populate("createdBy", "firstName lastName email")
      .populate("assessmentId", "title code")
      .lean();

    if (!interview) {
      throw new ApiError(404, "Interview not found");
    }

    if (isCandidate && interview.candidateId?.userId?.toString() !== userId.toString()) {
      throw new ApiError(403, "Access denied: You can only view your own interviews");
    }

    const participants = await InterviewParticipant.find({ interviewId })
      .populate("userId", "firstName lastName email role")
      .lean();

    return {
      ...interview,
      participants,
    };
  }

  /**
   * Joins an interview room and establishes/updates live session
   */
  static async joinInterview(organizationId, interviewId, userId, isCandidate = false) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID format");
    }

    const interview = await Interview.findOne({ _id: interviewId, organizationId });
    if (!interview) {
      throw new ApiError(404, "Interview not found");
    }

    if (interview.status === INTERVIEW_STATUSES.CANCELLED || interview.status === INTERVIEW_STATUSES.COMPLETED) {
      throw new ApiError(400, `Cannot join interview in '${interview.status}' status`);
    }

    // Verify participant registration
    let participant = await InterviewParticipant.findOne({ interviewId, userId });
    if (!participant) {
      if (isCandidate) {
        throw new ApiError(403, "You are not an authorized participant in this interview");
      }
      // Auto-register staff member
      participant = await InterviewParticipant.create({
        interviewId,
        userId,
        organizationId,
        role: PARTICIPANT_ROLES.INTERVIEWER,
        status: PARTICIPANT_STATUSES.JOINED,
        joinedAt: new Date(),
      });
    } else {
      participant.status = PARTICIPANT_STATUSES.JOINED;
      participant.joinedAt = new Date();
      await participant.save();
    }

    // Advance interview status to WAITING or LIVE
    if (interview.status === INTERVIEW_STATUSES.SCHEDULED) {
      interview.status = INTERVIEW_STATUSES.LIVE;
      await interview.save();
    }

    // Get or Create Active Live Session
    let session = await InterviewSession.findOne({
      interviewId,
      status: { $in: [SESSION_STATUSES.INITIALIZING, SESSION_STATUSES.ACTIVE] },
    });

    if (!session) {
      session = await InterviewSession.create({
        interviewId,
        sessionId: `sess_${crypto.randomBytes(8).toString("hex")}`,
        organizationId,
        status: SESSION_STATUSES.ACTIVE,
        hostUserId: userId,
        participantCount: 1,
        startedAt: new Date(),
      });
    } else {
      session.participantCount += 1;
      await session.save();
    }

    return {
      interviewId: interview._id,
      sessionId: session.sessionId,
      status: interview.status,
      participantRole: participant.role,
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      settings: interview.settings,
    };
  }

  /**
   * Concludes an interview session
   */
  static async endInterview(organizationId, interviewId, userId) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID format");
    }

    const interview = await Interview.findOne({ _id: interviewId, organizationId });
    if (!interview) {
      throw new ApiError(404, "Interview not found");
    }

    interview.status = INTERVIEW_STATUSES.COMPLETED;
    await interview.save();

    await InterviewSession.updateMany(
      { interviewId, status: { $ne: SESSION_STATUSES.ENDED } },
      { status: SESSION_STATUSES.ENDED, endedAt: new Date() }
    );

    await InterviewEvent.create({
      interviewId,
      organizationId,
      userId,
      type: INTERVIEW_EVENT_TYPES.INTERVIEW_ENDED,
      data: { endedAt: new Date() },
    });

    return interview;
  }

  /**
   * Cancels an interview
   */
  static async cancelInterview(organizationId, interviewId, userId, reason = "") {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID format");
    }

    const interview = await Interview.findOne({ _id: interviewId, organizationId });
    if (!interview) {
      throw new ApiError(404, "Interview not found");
    }

    interview.status = INTERVIEW_STATUSES.CANCELLED;
    interview.metadata = { ...interview.metadata, cancellationReason: reason };
    await interview.save();

    await InterviewEvent.create({
      interviewId,
      organizationId,
      userId,
      type: INTERVIEW_EVENT_TYPES.INTERVIEW_CANCELLED,
      data: { reason },
    });

    return interview;
  }

  /**
   * Adds participant to interview
   */
  static async addParticipant(organizationId, interviewId, { userId, role }) {
    if (!mongoose.Types.ObjectId.isValid(interviewId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, "Invalid ID format");
    }

    const participant = await InterviewParticipant.findOneAndUpdate(
      { interviewId, userId },
      {
        interviewId,
        userId,
        organizationId,
        role: role || PARTICIPANT_ROLES.INTERVIEWER,
        status: PARTICIPANT_STATUSES.INVITED,
      },
      { upsert: true, new: true }
    );

    return participant;
  }

  /**
   * Removes participant from interview
   */
  static async removeParticipant(organizationId, interviewId, targetUserId) {
    return InterviewParticipant.findOneAndDelete({
      interviewId,
      userId: targetUserId,
      organizationId,
    });
  }
}
