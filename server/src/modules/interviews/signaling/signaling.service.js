import Interview from "../interview.model.js";
import InterviewParticipant from "../interviewParticipant.model.js";
import InterviewEvent from "../interviewEvent.model.js";
import { INTERVIEW_EVENT_TYPES } from "../interview.constants.js";
import { logger } from "../../../config/logger.js";

// In-memory active presence map: interviewId -> Map of socketId -> participant
const activeRooms = new Map();

export class SignalingService {
  /**
   * Authorizes user to join a specific interview room
   */
  static async authorizeConnection(interviewId, user, organizationId, ioNamespace = null) {
    const userId = user?._id || user?.id || user;
    const userEmail = user?.email || "";
    const userRole = user?.role || (String(userId).startsWith("guest_") ? "CANDIDATE" : "EXAMINER");

    try {
      let interview = null;
      if (interviewId && interviewId.length === 24 && /^[0-9a-fA-F]{24}$/.test(interviewId)) {
        interview = await Interview.findById(interviewId).lean();
      }

      if (interview && (interview.status === "CANCELLED" || interview.status === "COMPLETED")) {
        return {
          authorized: false,
          reason: "This interview session has already concluded and is permanently closed. Re-joining is not permitted.",
        };
      }

      const isGuest = String(userId).startsWith("guest_") || user?.isGuest === true;
      const isCandidateRole = isGuest || userRole === "CANDIDATE";

      // 1. If Candidate, check active participants in room
      if (isCandidateRole) {
        const strId = interviewId.toString();
        const roomMap = activeRooms.get(strId);

        if (roomMap && roomMap.size > 0) {
          // Clean up stale sockets that are no longer connected
          if (ioNamespace && ioNamespace.sockets) {
            for (const [sId] of roomMap.entries()) {
              if (!ioNamespace.sockets.has(sId)) {
                roomMap.delete(sId);
              }
            }
          }

          // Check if there is another truly distinct candidate currently in the room
          const activeCandidate = Array.from(roomMap.values()).find((p) => {
            if (p.role !== "CANDIDATE") return false;
            // Same user ID
            if (String(p.userId) === String(userId)) return false;
            // Same candidate email
            if (userEmail && p.email && p.email.toLowerCase() === userEmail.toLowerCase()) return false;
            // Same guest session prefix for this interview
            if (String(p.userId).startsWith(`guest_${strId}`) && String(userId).startsWith(`guest_${strId}`)) return false;
            return true;
          });

          // If this is the specific assigned candidate for this scheduled interview, always permit entry
          const isAssignedCandidate = interview && (
            (interview.candidateId && String(interview.candidateId._id || interview.candidateId) === String(userId)) ||
            (interview.candidateEmail && userEmail && interview.candidateEmail.toLowerCase() === userEmail.toLowerCase())
          );

          if (activeCandidate && !isAssignedCandidate) {
            return {
              authorized: false,
              isRoomOccupied: true,
              activeCandidate: activeCandidate.name || "Candidate",
              reason: "Another candidate is currently in the oral defense room with the examiner. Please wait in the queue for your turn.",
              role: "CANDIDATE",
              interview: interview || { _id: interviewId, status: "LIVE" },
            };
          }
        }

        return {
          authorized: true,
          role: "CANDIDATE",
          interview: interview || { _id: interviewId, status: "LIVE" },
        };
      }

      // 2. Examiners, Proctors, Admins, and Owners are ALWAYS authorized to join/leave/rejoin
      if (
        userRole === "ORGANIZATION_ADMIN" ||
        userRole === "EXAMINER" ||
        userRole === "PROCTOR" ||
        userRole === "RECRUITER" ||
        userRole === "PLATFORM_OWNER" ||
        userRole === "PLATFORM_ADMIN" ||
        (interview && String(interview.createdBy) === String(userId))
      ) {
        return {
          authorized: true,
          role: "EXAMINER",
          interview: interview || { _id: interviewId, status: "LIVE" },
        };
      }

      const participant = await InterviewParticipant.findOne({ interviewId, userId }).lean();
      return {
        authorized: true,
        role: participant?.role || (userRole === "CANDIDATE" ? "CANDIDATE" : "EXAMINER"),
        interview: interview || { _id: interviewId, status: "LIVE" },
      };
    } catch (err) {
      logger.warn(`[SignalingService] Auth check exception: ${err.message}`);
      return {
        authorized: true,
        role: String(userId).startsWith("guest_") ? "CANDIDATE" : "EXAMINER",
        interview: { _id: interviewId, status: "LIVE" },
      };
    }
  }

  /**
   * Adds socket to active room tracking
   */
  static registerParticipant(interviewId, socketId, user) {
    const strId = interviewId.toString();
    if (!activeRooms.has(strId)) {
      activeRooms.set(strId, new Map());
    }
    const roomMap = activeRooms.get(strId);

    // If same user or guest candidate had an older socket in this room, remove the old entry
    const uId = user.id || user._id;
    for (const [sId, p] of roomMap.entries()) {
      if (sId !== socketId && (String(p.userId) === String(uId) || (user.email && p.email === user.email))) {
        roomMap.delete(sId);
      }
    }

    roomMap.set(socketId, {
      socketId,
      userId: uId,
      email: user.email || "",
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || (user.role === "CANDIDATE" ? "Candidate" : "Examiner"),
      role: user.role || "CANDIDATE",
      joinedAt: new Date(),
    });
    logger.info(`[SignalingService] Socket ${socketId} registered in room ${strId} (User: ${uId}, Role: ${user.role})`);
  }

  /**
   * Removes socket from active room tracking
   */
  static unregisterParticipant(socketId) {
    for (const [interviewId, roomMap] of activeRooms.entries()) {
      if (roomMap.has(socketId)) {
        const participant = roomMap.get(socketId);
        roomMap.delete(socketId);
        if (roomMap.size === 0) {
          activeRooms.delete(interviewId);
        }
        logger.info(`[SignalingService] Socket ${socketId} unregistered from room ${interviewId}`);
        return { interviewId, participant };
      }
    }
    return null;
  }

  /**
   * Retrieves active participants in room
   */
  static getActiveRoomParticipants(interviewId) {
    const strId = interviewId.toString();
    if (!activeRooms.has(strId)) return [];
    return Array.from(activeRooms.get(strId).values());
  }

  /**
   * Records audit event in database
   */
  static async recordAuditEvent(interviewId, organizationId, userId, type, data = {}) {
    try {
      await InterviewEvent.create({
        interviewId,
        organizationId,
        userId,
        type,
        data,
      });
    } catch (err) {
      logger.warn(`[SignalingService] Failed to record audit event: ${err.message}`);
    }
  }
}
