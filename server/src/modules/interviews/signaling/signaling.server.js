import { SIGNALING_EVENTS } from "./signaling.events.js";
import { SignalingService } from "./signaling.service.js";
import { INTERVIEW_EVENT_TYPES } from "../interview.constants.js";
import { verifyAccessToken } from "../../../utils/token.js";
import User from "../../users/user.model.js";
import { logger } from "../../../config/logger.js";

export const attachInterviewSignaling = (io) => {
  if (!io) return;

  const interviewNamespace = io.of("/interviews");

  // JWT Handshake Authentication Middleware
  interviewNamespace.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Authentication token required for live interview signaling"));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.sub || decoded.id).lean();
      if (!user || user.status !== "ACTIVE") {
        return next(new Error("User account is inactive or not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  interviewNamespace.on("connection", (socket) => {
    logger.info(`[SignalingServer] Connected socket: ${socket.id} (User: ${socket.user._id})`);

    // 1. Join Interview Room
    socket.on(SIGNALING_EVENTS.INTERVIEW_JOIN, async ({ interviewId, organizationId }) => {
      try {
        const authCheck = await SignalingService.authorizeConnection(
          interviewId,
          socket.user._id,
          organizationId
        );

        if (!authCheck.authorized) {
          return socket.emit("error", { message: authCheck.reason });
        }

        const roomId = `interview_${interviewId}`;
        socket.join(roomId);
        socket.interviewId = interviewId;
        socket.organizationId = organizationId;
        socket.userRole = authCheck.role;

        SignalingService.registerParticipant(interviewId, socket.id, {
          id: socket.user._id,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
          role: authCheck.role,
        });

        // Notify existing peers
        socket.to(roomId).emit(SIGNALING_EVENTS.PARTICIPANT_JOINED, {
          socketId: socket.id,
          userId: socket.user._id,
          name: `${socket.user.firstName} ${socket.user.lastName}`.trim(),
          role: authCheck.role,
        });

        // Send existing active peers to new joiner
        const activePeers = SignalingService.getActiveRoomParticipants(interviewId);
        socket.emit("room:peers", { peers: activePeers });

        await SignalingService.recordAuditEvent(
          interviewId,
          organizationId,
          socket.user._id,
          INTERVIEW_EVENT_TYPES.PARTICIPANT_JOINED,
          { socketId: socket.id, role: authCheck.role }
        );
      } catch (err) {
        logger.error(`[SignalingServer] Error joining room: ${err.message}`);
        socket.emit("error", { message: "Failed to join interview room" });
      }
    });

    // 2. WebRTC P2P Relays
    socket.on(SIGNALING_EVENTS.WEBRTC_OFFER, ({ targetSocketId, sdp }) => {
      interviewNamespace.to(targetSocketId).emit(SIGNALING_EVENTS.WEBRTC_OFFER, {
        senderSocketId: socket.id,
        senderUserId: socket.user._id,
        sdp,
      });
    });

    socket.on(SIGNALING_EVENTS.WEBRTC_ANSWER, ({ targetSocketId, sdp }) => {
      interviewNamespace.to(targetSocketId).emit(SIGNALING_EVENTS.WEBRTC_ANSWER, {
        senderSocketId: socket.id,
        senderUserId: socket.user._id,
        sdp,
      });
    });

    socket.on(SIGNALING_EVENTS.WEBRTC_ICE_CANDIDATE, ({ targetSocketId, candidate }) => {
      interviewNamespace.to(targetSocketId).emit(SIGNALING_EVENTS.WEBRTC_ICE_CANDIDATE, {
        senderSocketId: socket.id,
        candidate,
      });
    });

    // 3. Media Controls (Camera / Mic / Screen Share)
    socket.on(SIGNALING_EVENTS.CAMERA_CHANGED, ({ enabled }) => {
      if (socket.interviewId) {
        socket.to(`interview_${socket.interviewId}`).emit(SIGNALING_EVENTS.CAMERA_CHANGED, {
          socketId: socket.id,
          userId: socket.user._id,
          enabled,
        });
      }
    });

    socket.on(SIGNALING_EVENTS.MICROPHONE_CHANGED, ({ enabled }) => {
      if (socket.interviewId) {
        socket.to(`interview_${socket.interviewId}`).emit(SIGNALING_EVENTS.MICROPHONE_CHANGED, {
          socketId: socket.id,
          userId: socket.user._id,
          enabled,
        });
      }
    });

    socket.on(SIGNALING_EVENTS.SCREEN_SHARE_STARTED, async () => {
      if (socket.interviewId) {
        socket.to(`interview_${socket.interviewId}`).emit(SIGNALING_EVENTS.SCREEN_SHARE_STARTED, {
          socketId: socket.id,
          userId: socket.user._id,
        });
        await SignalingService.recordAuditEvent(
          socket.interviewId,
          socket.organizationId,
          socket.user._id,
          INTERVIEW_EVENT_TYPES.SCREEN_SHARE_STARTED
        );
      }
    });

    socket.on(SIGNALING_EVENTS.SCREEN_SHARE_STOPPED, async () => {
      if (socket.interviewId) {
        socket.to(`interview_${socket.interviewId}`).emit(SIGNALING_EVENTS.SCREEN_SHARE_STOPPED, {
          socketId: socket.id,
          userId: socket.user._id,
        });
        await SignalingService.recordAuditEvent(
          socket.interviewId,
          socket.organizationId,
          socket.user._id,
          INTERVIEW_EVENT_TYPES.SCREEN_SHARE_STOPPED
        );
      }
    });

    // 4. In-Room Text Chat
    socket.on(SIGNALING_EVENTS.CHAT_MESSAGE, async ({ message }) => {
      if (socket.interviewId && message) {
        const payload = {
          senderId: socket.user._id,
          senderName: `${socket.user.firstName} ${socket.user.lastName}`.trim(),
          message,
          timestamp: new Date(),
        };
        interviewNamespace.to(`interview_${socket.interviewId}`).emit(SIGNALING_EVENTS.CHAT_MESSAGE, payload);
        await SignalingService.recordAuditEvent(
          socket.interviewId,
          socket.organizationId,
          socket.user._id,
          INTERVIEW_EVENT_TYPES.CHAT_MESSAGE,
          { message }
        );
      }
    });

    // 5. Disconnect Cleanup
    socket.on("disconnect", async () => {
      const removed = SignalingService.unregisterParticipant(socket.id);
      if (removed) {
        const roomId = `interview_${removed.interviewId}`;
        socket.to(roomId).emit(SIGNALING_EVENTS.PARTICIPANT_LEFT, {
          socketId: socket.id,
          userId: removed.participant.userId,
          name: removed.participant.name,
        });
        if (socket.organizationId) {
          await SignalingService.recordAuditEvent(
            removed.interviewId,
            socket.organizationId,
            removed.participant.userId,
            INTERVIEW_EVENT_TYPES.PARTICIPANT_LEFT,
            { socketId: socket.id }
          );
        }
      }
    });
  });

  logger.info("[SignalingServer] WebRTC signaling attached to namespace /interviews");
};
