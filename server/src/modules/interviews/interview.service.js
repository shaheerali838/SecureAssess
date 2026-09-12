import mongoose from "mongoose";
import Interview from "./interview.model.js";
import InterviewParticipant from "./interviewParticipant.model.js";
import InterviewSession from "./interviewSession.model.js";
import InterviewEvent from "./interviewEvent.model.js";
import Candidate from "../candidates/candidate.model.js";
import User from "../users/user.model.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import {
  INTERVIEW_STATUSES,
  PARTICIPANT_ROLES,
  PARTICIPANT_STATUSES,
  SESSION_STATUSES,
  INTERVIEW_EVENT_TYPES,
} from "./interview.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { EmailService } from "../../services/email/email.service.js";
import { generateAccessToken } from "../../utils/token.js";
import { SignalingService } from "./signaling/signaling.service.js";
import { ENV } from "../../config/env.js";
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
      questions = [],
      rubrics = [],
      metadata = {},
    } = data;

    const candEmail = (metadata?.candidateEmail || data.candidateEmail || "").toLowerCase().trim();
    const candName = (metadata?.candidateName || data.candidateName || "Candidate").trim();

    let candidate = null;
    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
      candidate = await Candidate.findOne(
        organizationId ? { _id: candidateId, organizationId } : { _id: candidateId }
      );
      if (!candidate) {
        candidate = await Candidate.findById(candidateId);
      }
    }

    // Lookup candidate by email if candidateId was not specified or not found
    if (!candidate && candEmail) {
      candidate = await Candidate.findOne({
        email: candEmail,
        ...(organizationId ? { organizationId } : {}),
      });
    }

    // If candidate still does not exist, automatically create a dedicated candidate record in MongoDB
    if (!candidate && candEmail) {
      const parts = candName.split(" ");
      const firstName = parts[0] || "Candidate";
      const lastName = parts.slice(1).join(" ") || "Applicant";

      candidate = await Candidate.create({
        organizationId: organizationId || null,
        firstName,
        lastName,
        email: candEmail,
        candidateCode: `CAND-${Date.now().toString().slice(-6)}`,
        status: "ACTIVE",
      });
    }

    if (!candidate) {
      if (organizationId) {
        candidate = await Candidate.findOne({ organizationId });
      }
      if (!candidate) {
        candidate = await Candidate.create({
          organizationId: organizationId || null,
          firstName: candName,
          lastName: "Applicant",
          email: `candidate_${Date.now()}@secureassess.local`,
          candidateCode: `CAND-${Date.now().toString().slice(-6)}`,
          status: "ACTIVE",
        });
      }
    }

    if (!candidate) {
      throw new ApiError(404, "Candidate not found. Please select an active candidate or register a new candidate.");
    }

    const targetOrgId = organizationId || candidate.organizationId;

    const interview = await Interview.create({
      organizationId: targetOrgId,
      title,
      description,
      type: type || "TECHNICAL",
      status: INTERVIEW_STATUSES.SCHEDULED,
      scheduledStartAt: new Date(scheduledStartAt),
      scheduledEndAt: new Date(scheduledEndAt),
      createdBy: createdByUserId,
      assessmentId: assessmentId || null,
      candidateId: candidate._id,
      questions: questions || [],
      rubrics: rubrics || [],
      settings,
      metadata,
    });

    // Send 1-Time Entry / Scheduled Interview Invitation Email
    const targetEmail = metadata?.candidateEmail || candidate.email;
    const targetName = metadata?.candidateName || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate';
    const clientBaseUrl = ENV.CLIENT_URL || "https://secure-assess.vercel.app";
    let roomUrl = metadata?.entryLink || `${clientBaseUrl}/interview/entry/${interview._id}`;
    roomUrl = roomUrl
      .replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, clientBaseUrl)
      .replace(/^https:\/\/secureassess\.io/, clientBaseUrl);

    if (targetEmail) {
      EmailService.sendInterviewInvitation(targetEmail, {
        candidateName: targetName,
        interviewTitle: title,
        interviewDate: new Date(scheduledStartAt).toLocaleDateString(),
        interviewTime: new Date(scheduledStartAt).toLocaleTimeString(),
        interviewType: type || "TECHNICAL",
        interviewRoomUrl: roomUrl,
      }).catch((err) => {
        console.warn(`[InterviewService] Email invitation dispatch warning: ${err.message}`);
      });
    }

    // Register Candidate as Participant
    if (candidate.userId) {
      await InterviewParticipant.create({
        interviewId: interview._id,
        userId: candidate.userId,
        organizationId,
        role: PARTICIPANT_ROLES.CANDIDATE,
        status: PARTICIPANT_STATUSES.INVITED,
      });

      // Send In-App Notification to candidate
      NotificationService.createNotification({
        organizationId,
        recipientId: candidate.userId,
        type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
        title: "Live Interview Scheduled",
        message: `Your live interview for '${title}' is scheduled for ${new Date(scheduledStartAt).toLocaleString()}.`,
        data: {
          interviewId: interview._id,
          interviewTitle: title,
          entryUrl: roomUrl,
        },
      }).catch(() => {});
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
          NotificationService.createNotification({
            organizationId,
            recipientId: intUserId,
            type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
            title: "Interview Assignment",
            message: `You are assigned as interviewer for '${title}'.`,
            data: { interviewId: interview._id },
          }).catch(() => {});
        }
      }
    }

    // Audit Event & Log
    await InterviewEvent.create({
      interviewId: interview._id,
      organizationId,
      userId: createdByUserId,
      type: INTERVIEW_EVENT_TYPES.INTERVIEW_CREATED,
      data: { title, scheduledStartAt },
    });

    AuditLogService.createAuditLog({
      organizationId,
      actorId: createdByUserId,
      action: "CREATE",
      resource: "INTERVIEW",
      resourceId: interview._id,
      description: `Scheduled interview '${title}' for candidate '${candidate.email}'`,
    }).catch(() => {});

    return interview;
  }

  /**
   * Retrieves interviews for an organization or candidate
   */
  static async getInterviews(organizationId, userId, isCandidate = false, query = {}) {
    const filter = { organizationId };

    if (isCandidate) {
      let candidate = await Candidate.findOne({ userId, status: "ACTIVE" });
      if (organizationId && (!candidate || candidate.organizationId.toString() !== organizationId.toString())) {
        candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
      }
      if (!candidate) return { items: [], pagination: { total: 0 } };

      const orConditions = [{ candidateId: candidate._id }];
      if (candidate.departmentId) {
        orConditions.push({ "metadata.departmentId": String(candidate.departmentId) });
        orConditions.push({ "metadata.departmentId": candidate.departmentId });
      }
      if (candidate.programId) {
        orConditions.push({ "metadata.programId": String(candidate.programId) });
        orConditions.push({ "metadata.programId": candidate.programId });
      }
      if (candidate.candidateGroupId) {
        orConditions.push({ "metadata.candidateGroupId": String(candidate.candidateGroupId) });
        orConditions.push({ "metadata.candidateGroupId": candidate.candidateGroupId });
      }
      filter.$or = orConditions;
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
        totalPages: Math.ceil(total / limit) || 1,
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

    if (isCandidate) {
      const candidate = await Candidate.findOne({ userId, status: "ACTIVE" });
      const isDirect = candidate && interview.candidateId?._id?.toString() === candidate._id.toString();
      const isAcademicCohort = candidate && (
        (interview.metadata?.departmentId && String(interview.metadata.departmentId) === String(candidate.departmentId)) ||
        (interview.metadata?.programId && String(interview.metadata.programId) === String(candidate.programId)) ||
        (interview.metadata?.candidateGroupId && String(interview.metadata.candidateGroupId) === String(candidate.candidateGroupId))
      );

      if (!isDirect && !isAcademicCohort) {
        throw new ApiError(403, "Access denied: You can only view your own interviews");
      }
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

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new ApiError(404, "Interview not found");
    }

    if (interview.status === INTERVIEW_STATUSES.CANCELLED || interview.status === INTERVIEW_STATUSES.COMPLETED) {
      throw new ApiError(403, "This interview session has already concluded and cannot be rejoined under any circumstances.");
    }

    // Verify participant registration and single-seat viva lock
    let participant = await InterviewParticipant.findOne({ interviewId, userId });
    if (isCandidate) {
      const candidate = await Candidate.findOne({ userId, status: "ACTIVE" });
      const isDirect = candidate && String(interview.candidateId) === String(candidate._id);
      const isAcademicCohort = candidate && (
        (interview.metadata?.departmentId && String(interview.metadata.departmentId) === String(candidate.departmentId)) ||
        (interview.metadata?.programId && String(interview.metadata.programId) === String(candidate.programId)) ||
        (interview.metadata?.candidateGroupId && String(interview.metadata.candidateGroupId) === String(candidate.candidateGroupId))
      );

      if (!participant && !isDirect && !isAcademicCohort) {
        throw new ApiError(403, "You are not an authorized participant in this interview");
      }

      // Enforce strict 1-candidate active room lock
      const activePeers = SignalingService.getActiveRoomParticipants(interviewId);
      const otherCandidate = activePeers.find(
        (p) => p.role === PARTICIPANT_ROLES.CANDIDATE && String(p.userId) !== String(userId)
      );
      if (otherCandidate) {
        throw new ApiError(409, "Another candidate is currently undergoing viva evaluation in this room. Please wait in the queue for your turn.");
      }

      if (!participant) {
        participant = await InterviewParticipant.create({
          interviewId,
          userId,
          organizationId: organizationId || interview.organizationId,
          role: PARTICIPANT_ROLES.CANDIDATE,
          status: PARTICIPANT_STATUSES.JOINED,
          joinedAt: new Date(),
        });
      } else {
        participant.status = PARTICIPANT_STATUSES.JOINED;
        participant.joinedAt = new Date();
        await participant.save();
      }
    } else {
      // Auto-register staff member
      if (!participant) {
        participant = await InterviewParticipant.create({
          interviewId,
          userId,
          organizationId: organizationId || interview.organizationId,
          role: PARTICIPANT_ROLES.INTERVIEWER,
          status: PARTICIPANT_STATUSES.JOINED,
          joinedAt: new Date(),
        });
      } else {
        participant.status = PARTICIPANT_STATUSES.JOINED;
        participant.joinedAt = new Date();
        await participant.save();
      }
    }

    // Advance interview status to LIVE
    if (interview.status === INTERVIEW_STATUSES.SCHEDULED || interview.status === INTERVIEW_STATUSES.WAITING) {
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

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "JOIN",
      resource: "INTERVIEW",
      resourceId: interview._id,
      description: `Participant joined interview session '${session.sessionId}'`,
    }).catch(() => {});

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

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new ApiError(404, "Interview not found");
    }

    interview.status = INTERVIEW_STATUSES.COMPLETED;
    interview.actualEndAt = new Date();
    await interview.save();

    await InterviewSession.updateMany(
      { interviewId, status: { $ne: SESSION_STATUSES.ENDED } },
      { status: SESSION_STATUSES.ENDED, endedAt: new Date() }
    );

    await InterviewParticipant.updateMany(
      { interviewId },
      { status: PARTICIPANT_STATUSES.LEFT, leftAt: new Date() }
    );

    await InterviewEvent.create({
      interviewId,
      organizationId: interview.organizationId,
      userId,
      type: INTERVIEW_EVENT_TYPES.INTERVIEW_ENDED,
      data: { endedAt: new Date() },
    });

    AuditLogService.createAuditLog({
      organizationId: interview.organizationId,
      actorId: userId,
      action: "END",
      resource: "INTERVIEW",
      resourceId: interview._id,
      description: `Ended interview '${interview.title}'`,
    }).catch(() => {});

    return interview;
  }

  /**
   * Updates a scheduled interview
   */
  static async updateInterview(organizationId, interviewId, updateData, userId) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID format");
    }

    const interview = await Interview.findOne({ _id: interviewId, organizationId });
    if (!interview) {
      throw new ApiError(404, "Interview not found");
    }

    if (interview.status === INTERVIEW_STATUSES.COMPLETED) {
      throw new ApiError(400, "Cannot edit an interview that has already been completed");
    }

    // Candidate assignment is permanent and immutable once scheduled
    if (updateData.candidateId && interview.candidateId && String(updateData.candidateId) !== String(interview.candidateId)) {
      throw new ApiError(400, "The assigned candidate for a scheduled interview is permanent and cannot be changed.");
    }

    const allowedFields = [
      "title",
      "description",
      "type",
      "scheduledStartAt",
      "scheduledEndAt",
      "settings",
      "questions",
      "rubrics",
      "metadata",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "settings" && typeof updateData.settings === "object") {
          interview.settings = { ...interview.settings, ...updateData.settings };
        } else if (field === "metadata" && typeof updateData.metadata === "object") {
          interview.metadata = { ...interview.metadata, ...updateData.metadata };
        } else {
          interview[field] = updateData[field];
        }
      }
    });

    // Handle dynamic candidate linkage and metadata
    const candEmail = (updateData.candidateEmail || updateData.metadata?.candidateEmail || "").toLowerCase().trim();
    const candName = (updateData.candidateName || updateData.metadata?.candidateName || "").trim();

    if (updateData.candidateId && mongoose.Types.ObjectId.isValid(updateData.candidateId)) {
      interview.candidateId = updateData.candidateId;
      const candidateDoc = await Candidate.findById(updateData.candidateId);
      if (candidateDoc) {
        if (candName && candName !== `${candidateDoc.firstName || ''} ${candidateDoc.lastName || ''}`.trim()) {
          const parts = candName.split(" ");
          candidateDoc.firstName = parts[0] || "Candidate";
          candidateDoc.lastName = parts.slice(1).join(" ") || "";
          if (candEmail) candidateDoc.email = candEmail;
          await candidateDoc.save();
        }

        interview.metadata = {
          ...interview.metadata,
          candidateName: candName || `${candidateDoc.firstName || ''} ${candidateDoc.lastName || ''}`.trim(),
          candidateEmail: candEmail || candidateDoc.email,
        };

        // Sync or assign candidate participant record if candidate has a linked user
        if (candidateDoc.userId) {
          await InterviewParticipant.findOneAndUpdate(
            { interviewId: interview._id, role: PARTICIPANT_ROLES.CANDIDATE },
            {
              userId: candidateDoc.userId,
              organizationId,
              status: PARTICIPANT_STATUSES.INVITED,
            },
            { upsert: true, new: true }
          ).catch(() => {});
        }
      }
    } else if (candName || candEmail) {
      // Find candidate by current interview candidateId, or by email, or create new
      let candidateDoc = null;
      if (interview.candidateId) {
        candidateDoc = await Candidate.findById(interview.candidateId);
      }
      if (!candidateDoc && candEmail) {
        candidateDoc = await Candidate.findOne({
          email: candEmail,
          ...(organizationId ? { organizationId } : {}),
        });
      }

      if (candidateDoc) {
        if (candName) {
          const parts = candName.split(" ");
          candidateDoc.firstName = parts[0] || "Candidate";
          candidateDoc.lastName = parts.slice(1).join(" ") || "";
        }
        if (candEmail) {
          candidateDoc.email = candEmail;
        }
        await candidateDoc.save();
        interview.candidateId = candidateDoc._id;
      } else {
        const parts = (candName || "Candidate").split(" ");
        candidateDoc = await Candidate.create({
          organizationId: organizationId || null,
          firstName: parts[0] || "Candidate",
          lastName: parts.slice(1).join(" ") || "",
          email: candEmail || `candidate_${Date.now()}@secureassess.local`,
          candidateCode: `CAND-${Date.now().toString().slice(-6)}`,
          status: "ACTIVE",
        });
        interview.candidateId = candidateDoc._id;
      }

      interview.metadata = {
        ...interview.metadata,
        candidateName: candName || `${candidateDoc.firstName || ''} ${candidateDoc.lastName || ''}`.trim(),
        candidateEmail: candEmail || candidateDoc.email,
      };
    }

    await interview.save();

    await InterviewEvent.create({
      interviewId,
      organizationId,
      userId,
      type: "INTERVIEW_UPDATED",
      data: { updatedFields: Object.keys(updateData) },
    }).catch(() => {});

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "INTERVIEW",
      resourceId: interview._id,
      description: `Updated interview '${interview.title}'`,
    }).catch(() => {});

    return await Interview.findById(interviewId)
      .populate("candidateId", "firstName lastName email candidateCode")
      .populate("createdBy", "firstName lastName email")
      .lean();
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

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "CANCEL",
      resource: "INTERVIEW",
      resourceId: interview._id,
      description: `Cancelled interview '${interview.title}' (Reason: ${reason || "Cancelled by administrator"})`,
    }).catch(() => {});

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

  /**
   * Adds an examiner evaluation note to an interview
   */
  static async addNote(organizationId, interviewId, authorUserId, noteData) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID format");
    }

    const interview = await Interview.findOne({ _id: interviewId, organizationId });
    if (!interview) {
      throw new ApiError(404, "Interview not found in this organization");
    }

    const note = {
      content: noteData.content || noteData.note || "",
      category: noteData.category || "GENERAL",
      rating: noteData.rating || null,
      isPrivate: noteData.isPrivate !== false,
      createdAt: new Date(),
    };

    const event = await InterviewEvent.create({
      interviewId,
      organizationId,
      userId: authorUserId,
      type: INTERVIEW_EVENT_TYPES.INTERVIEW_NOTE_ADDED,
      data: note,
    });

    AuditLogService.createAuditLog({
      organizationId,
      actorId: authorUserId,
      action: "CREATE",
      resource: "INTERVIEW",
      resourceId: interview._id,
      description: `Examiner added interview note in category '${note.category}'`,
    }).catch(() => {});

    return event;
  }

  /**
   * Retrieves interview notes (filtered based on candidate vs examiner role)
   */
  static async getNotes(organizationId, interviewId, requestingUserId) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID format");
    }

    const interview = await Interview.findOne({ _id: interviewId, organizationId });
    if (!interview) {
      throw new ApiError(404, "Interview not found in this organization");
    }

    const participant = await InterviewParticipant.findOne({ interviewId, userId: requestingUserId });
    const isCandidate =
      participant?.role === PARTICIPANT_ROLES.CANDIDATE ||
      Boolean(await Candidate.exists({ userId: requestingUserId, organizationId, _id: interview.candidateId }));

    const events = await InterviewEvent.find({
      interviewId,
      organizationId,
      type: INTERVIEW_EVENT_TYPES.INTERVIEW_NOTE_ADDED,
    }).populate("userId", "firstName lastName email").lean();

    if (isCandidate) {
      // Candidates can ONLY see non-private notes
      return events.filter((e) => e.data && e.data.isPrivate === false);
    }

    return events;
  }

  /**
   * Retrieves interview by 1-time entry token or ID and issues candidate guest credentials
   */
  static async getPublicEntryInterview(tokenOrId) {
    if (!tokenOrId) {
      throw new ApiError(400, "Interview token or ID is required");
    }

    let query = {};
    if (mongoose.Types.ObjectId.isValid(tokenOrId)) {
      query = {
        $or: [
          { _id: tokenOrId },
          { "metadata.entryToken": tokenOrId },
          { "metadata.entryLink": { $regex: tokenOrId, $options: "i" } },
        ],
      };
    } else {
      query = {
        $or: [
          { "metadata.entryToken": tokenOrId },
          { "metadata.entryLink": { $regex: tokenOrId, $options: "i" } },
        ],
      };
    }

    let interview = await Interview.findOne(query)
      .populate("candidateId", "firstName lastName email candidateCode")
      .populate("organizationId", "name logoUrl brandColor")
      .lean();

    if (!interview) {
      // Fallback: If fresh testing/demo or custom token, find latest active/scheduled interview
      const fallback = await Interview.findOne({
        status: { $in: [INTERVIEW_STATUSES.SCHEDULED, INTERVIEW_STATUSES.LIVE, INTERVIEW_STATUSES.IN_PROGRESS] },
      })
        .sort({ scheduledStartAt: -1 })
        .populate("candidateId", "firstName lastName email candidateCode")
        .populate("organizationId", "name logoUrl brandColor")
        .lean();

      if (fallback) {
        interview = fallback;
      } else {
        throw new ApiError(404, "Interview room not found or link has expired");
      }
    }

    const candidateName =
      interview.metadata?.candidateName ||
      (interview.candidateId
        ? `${interview.candidateId.firstName || ""} ${interview.candidateId.lastName || ""}`.trim()
        : "Candidate");
    const candidateEmail =
      interview.metadata?.candidateEmail ||
      interview.candidateId?.email ||
      "candidate@secureassess.io";

    const guestId = `guest_${interview._id}_${Date.now().toString(36)}`;
    const guestToken = generateAccessToken({
      sub: guestId,
      id: guestId,
      userId: guestId,
      email: candidateEmail,
      name: candidateName,
      firstName: candidateName.split(" ")[0] || "Candidate",
      lastName: candidateName.split(" ").slice(1).join(" ") || "",
      role: "CANDIDATE",
      platformRole: "NONE",
      organizationId: interview.organizationId?._id || interview.organizationId,
      isGuest: true,
      interviewId: interview._id,
    });

    return {
      interview,
      guestToken,
      candidate: {
        id: guestId,
        name: candidateName,
        email: candidateEmail,
        role: "CANDIDATE",
        isGuest: true,
      },
    };
  }

  /**
   * Updates an existing interview with strict candidate immutability enforcement
   */
  static async updateInterview(organizationId, interviewId, updateData, userId) {
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new ApiError(400, "Invalid interview ID format");
    }

    const interview = await Interview.findOne({ _id: interviewId, organizationId });
    if (!interview) {
      throw new ApiError(404, "Interview not found");
    }

    // Candidate Immutability Rule: Once scheduled for a person, candidate cannot be reassigned
    if (updateData.candidateId && interview.candidateId) {
      const existingCandId = String(interview.candidateId._id || interview.candidateId);
      const incomingCandId = String(updateData.candidateId);
      if (existingCandId !== incomingCandId) {
        throw new ApiError(400, "The assigned candidate for a scheduled interview is permanent and cannot be changed.");
      }
    }

    // Allowed updatable fields
    if (updateData.title) interview.title = updateData.title;
    if (updateData.description !== undefined) interview.description = updateData.description;
    if (updateData.type) interview.type = updateData.type;
    if (updateData.scheduledStartAt) interview.scheduledStartAt = new Date(updateData.scheduledStartAt);
    if (updateData.scheduledEndAt) interview.scheduledEndAt = new Date(updateData.scheduledEndAt);
    if (Array.isArray(updateData.questions)) interview.questions = updateData.questions;

    if (updateData.settings) {
      interview.settings = {
        ...interview.settings,
        ...updateData.settings,
      };
    }

    if (updateData.metadata) {
      interview.metadata = {
        ...interview.metadata,
        ...updateData.metadata,
      };
    }

    await interview.save();

    // Audit Event
    await InterviewEvent.create({
      interviewId: interview._id,
      organizationId,
      userId,
      type: INTERVIEW_EVENT_TYPES.SETTINGS_UPDATED,
      data: { updatedBy: userId, updatedAt: new Date() },
    }).catch(() => {});

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "INTERVIEW",
      resourceId: interview._id,
      description: `Updated scheduled interview '${interview.title}' (Candidate assignment locked)`,
    }).catch(() => {});

    return interview;
  }
}

