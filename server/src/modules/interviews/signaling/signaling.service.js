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
  static async authorizeConnection(interviewId, userId, organizationId) {
    const interview = await Interview.findOne({ _id: interviewId, organizationId }).lean();
    if (!interview) {
      return { authorized: false, reason: "Interview not found" };
    }

    if (interview.status === "CANCELLED" || interview.status === "COMPLETED") {
      return { authorized: false, reason: `Interview is already ${interview.status.toLowerCase()}` };
    }

    const participant = await InterviewParticipant.findOne({ interviewId, userId }).lean();
    if (!participant) {
      return { authorized: false, reason: "User is not a registered participant in this interview" };
    }

    return {
      authorized: true,
      role: participant.role,
      interview,
    };
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
