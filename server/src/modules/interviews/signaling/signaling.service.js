import Interview from "../interview.model.js";
import InterviewParticipant from "../interviewParticipant.model.js";
import InterviewEvent from "../interviewEvent.model.js";
import { INTERVIEW_EVENT_TYPES } from "../interview.constants.js";
import { logger } from "../../../config/logger.js";

// In-memory active presence map: interviewId -> Set of { socketId, userId, role }
const activeRooms = new Map();

export class SignalingService {
  /**
   * Authorizes user to join a specific interview room
   */
  static async authorizeConnection(interviewId, user, organizationId) {
    const userId = user?._id || user?.id || user;
    const userRole = user?.role || (String(userId).startsWith("guest_") ? "CANDIDATE" : "EXAMINER");

    try {
      let interview = null;
      if (interviewId && interviewId.length === 24 && /^[0-9a-fA-F]{24}$/.test(interviewId)) {
        const query = organizationId ? { _id: interviewId, organizationId } : { _id: interviewId };
        interview = await Interview.findOne(query).lean();
      }

      if (interview && (interview.status === "CANCELLED" || interview.status === "COMPLETED")) {
        return { authorized: false, reason: `Interview is already ${interview.status.toLowerCase()}` };
      }

      const isGuest = String(userId).startsWith("guest_") || user?.isGuest === true;
      if (isGuest || userRole === "CANDIDATE") {
        return {
          authorized: true,
          role: "CANDIDATE",
          interview: interview || { _id: interviewId, status: "LIVE" },
        };
      }

      // Check if user is an examiner, host, or admin
      if (
        userRole === "ORGANIZATION_ADMIN" ||
        userRole === "EXAMINER" ||
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
    roomMap.set(socketId, {
      socketId,
      userId: user.id || user._id,
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
      role: user.role || "CANDIDATE",
      joinedAt: new Date(),
    });
    logger.info(`[SignalingService] Socket ${socketId} registered in room ${strId}`);
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
