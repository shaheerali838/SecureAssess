import { SIGNALING_EVENTS } from "./signaling.events.js";
import { SignalingService } from "./signaling.service.js";
import { INTERVIEW_EVENT_TYPES } from "../interview.constants.js";
import { verifyAccessToken } from "../../../utils/token.js";
import User from "../../users/user.model.js";
import Interview from "../interview.model.js";
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

      if (token) {
        try {
          const decoded = verifyAccessToken(token);

          if (decoded.isGuest) {
            socket.user = {
              _id: decoded.sub || decoded.id || `guest_${socket.id}`,
              id: decoded.sub || decoded.id || `guest_${socket.id}`,
              firstName: decoded.name || decoded.firstName || "Candidate",
              lastName: decoded.lastName || "",
              email: decoded.email || "",
              role: "CANDIDATE",
              isGuest: true,
              status: "ACTIVE",
              organizationId: decoded.organizationId,
            };
            return next();
          }

          const user = await User.findById(decoded.sub || decoded.id).lean();
          if (user && user.status === "ACTIVE") {
            socket.user = {
              ...user,
              id: user._id.toString(),
            };
            return next();
          }
        } catch (tokenErr) {
          logger.warn(
            `[SignalingServer] Token verification notice: ${tokenErr.message}`,
          );
        }
      }

      // Guest / Candidate entry fallback (for scheduled entry links, public tokens, or direct candidate access)
      const candidateName =
        socket.handshake.auth?.candidateName ||
        socket.handshake.auth?.name ||
        "Candidate";
      const candidateId =
        socket.handshake.auth?.candidateId ||
        socket.handshake.auth?.userId ||
        `guest_${socket.id}`;
      const candidateEmail =
        socket.handshake.auth?.candidateEmail ||
        socket.handshake.auth?.email ||
        "";

      socket.user = {
        _id: candidateId,
        id: candidateId,
        firstName: candidateName.split(" ")[0] || "Candidate",
        lastName: candidateName.split(" ").slice(1).join(" ") || "",
        email: candidateEmail,
        role: "CANDIDATE",
        isGuest: true,
        status: "ACTIVE",
        organizationId: socket.handshake.auth?.organizationId,
      };
      return next();
    } catch (err) {
      logger.error(
        `[SignalingServer] Handshake middleware exception: ${err.message}`,
      );
      return next(new Error(`Authentication failed: ${err.message}`));
    }
  });

  interviewNamespace.on("connection", (socket) => {
    logger.info(
      `[SignalingServer] Connected socket: ${socket.id} (User: ${socket.user?._id})`,
    );

    // 1. Join Interview Room
    socket.on(
      SIGNALING_EVENTS.INTERVIEW_JOIN,
      async ({ interviewId, organizationId }) => {
        try {
          const authCheck = await SignalingService.authorizeConnection(
            interviewId,
            socket.user,
            organizationId,
            interviewNamespace,
          );

          if (!authCheck.authorized) {
            if (authCheck.isRoomOccupied) {
              socket.emit("room:occupied", {
                message: authCheck.reason,
                occupied: true,
                activeCandidate: authCheck.activeCandidate,
              });
            }
            return socket.emit("error", {
              message: authCheck.reason,
              isRoomOccupied: authCheck.isRoomOccupied || false,
              activeCandidate: authCheck.activeCandidate || null,
            });
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
            email: socket.user.email,
            role: authCheck.role,
          });

          // Check if an Examiner / Host is currently present in the room
          const activePeers =
            SignalingService.getActiveRoomParticipants(interviewId);
          const isHost = authCheck.role !== "CANDIDATE";
          const hasHost = activePeers.some((p) => p.role !== "CANDIDATE");

          // Notify existing peers in room
          socket.to(roomId).emit(SIGNALING_EVENTS.PARTICIPANT_JOINED, {
            socketId: socket.id,
            userId: socket.user._id,
            name:
              `${socket.user.firstName || ""} ${socket.user.lastName || ""}`.trim() ||
              (isHost ? "Examiner" : "Candidate"),
            role: authCheck.role,
          });

          // If the joining user is the host/examiner, immediately admit all waiting candidates
          if (isHost) {
            interviewNamespace.to(roomId).emit("interview:host-joined", {
              host: {
                socketId: socket.id,
                userId: socket.user._id,
                name:
                  `${socket.user.firstName || ""} ${socket.user.lastName || ""}`.trim() ||
                  "Examiner",
                role: authCheck.role,
              },
            });
            interviewNamespace.to(roomId).emit("interview:admitted", {
              admittedBy: socket.user._id,
            });
          } else if (hasHost) {
            // If host is already present, immediately tell candidate that host is present
            const hostPeer = activePeers.find((p) => p.role !== "CANDIDATE");
            socket.emit("interview:host-joined", {
              host: hostPeer || { role: "EXAMINER", name: "Examiner" },
            });
            socket.emit("interview:admitted", {
              admitted: true,
            });
          }

          // Send active peers and waiting room status to new joiner
          socket.emit("room:peers", {
            peers: activePeers,
            hasHost: hasHost || isHost,
            waitingForHost: !isHost && !hasHost,
          });

          await SignalingService.recordAuditEvent(
            interviewId,
            organizationId,
            socket.user._id,
            INTERVIEW_EVENT_TYPES.PARTICIPANT_JOINED,
            { socketId: socket.id, role: authCheck.role },
          );
        } catch (err) {
          logger.error(`[SignalingServer] Error joining room: ${err.message}`);
          socket.emit("error", { message: "Failed to join interview room" });
        }
      },
    );

    // Candidate announces readiness for WebRTC offer from Examiner
    socket.on("interview:candidate-ready", ({ interviewId }) => {
      const roomId = `interview_${interviewId || socket.interviewId}`;
      socket.to(roomId).emit("interview:candidate-ready", {
        candidateSocketId: socket.id,
        candidateUserId: socket.user?._id,
        name:
          `${socket.user?.firstName || ""} ${socket.user?.lastName || ""}`.trim() ||
          "Candidate",
      });
    });

    // Examiner manually admits candidate from waiting room
    socket.on(
      "interview:admit-candidate",
      ({ candidateSocketId, interviewId }) => {
        const roomId = `interview_${interviewId || socket.interviewId}`;
        if (candidateSocketId) {
          interviewNamespace.to(candidateSocketId).emit("interview:admitted", {
            admittedBy: socket.user?._id,
          });
        } else {
          interviewNamespace.to(roomId).emit("interview:admitted", {
            admittedBy: socket.user?._id,
          });
        }
      },
    );

    // 2. WebRTC P2P Relays
    socket.on(SIGNALING_EVENTS.WEBRTC_OFFER, ({ targetSocketId, sdp }) => {
      interviewNamespace
        .to(targetSocketId)
        .emit(SIGNALING_EVENTS.WEBRTC_OFFER, {
          senderSocketId: socket.id,
          senderUserId: socket.user._id,
          sdp,
        });
    });

    socket.on(SIGNALING_EVENTS.WEBRTC_ANSWER, ({ targetSocketId, sdp }) => {
      interviewNamespace
        .to(targetSocketId)
        .emit(SIGNALING_EVENTS.WEBRTC_ANSWER, {
          senderSocketId: socket.id,
          senderUserId: socket.user._id,
          sdp,
        });
    });

    socket.on(
      SIGNALING_EVENTS.WEBRTC_ICE_CANDIDATE,
      ({ targetSocketId, candidate }) => {
        interviewNamespace
          .to(targetSocketId)
          .emit(SIGNALING_EVENTS.WEBRTC_ICE_CANDIDATE, {
            senderSocketId: socket.id,
            candidate,
          });
      },
    );

    // 3. Media Controls (Camera / Mic / Screen Share)
    socket.on(SIGNALING_EVENTS.CAMERA_CHANGED, ({ enabled }) => {
      if (socket.interviewId) {
        socket
          .to(`interview_${socket.interviewId}`)
          .emit(SIGNALING_EVENTS.CAMERA_CHANGED, {
            socketId: socket.id,
            userId: socket.user._id,
            enabled,
          });
      }
    });

    socket.on(SIGNALING_EVENTS.MICROPHONE_CHANGED, ({ enabled }) => {
      if (socket.interviewId) {
        socket
          .to(`interview_${socket.interviewId}`)
          .emit(SIGNALING_EVENTS.MICROPHONE_CHANGED, {
            socketId: socket.id,
            userId: socket.user._id,
            enabled,
          });
      }
    });

    socket.on(SIGNALING_EVENTS.SCREEN_SHARE_STARTED, async () => {
      if (socket.interviewId) {
        socket
          .to(`interview_${socket.interviewId}`)
          .emit(SIGNALING_EVENTS.SCREEN_SHARE_STARTED, {
            socketId: socket.id,
            userId: socket.user._id,
          });
        await SignalingService.recordAuditEvent(
          socket.interviewId,
          socket.organizationId,
          socket.user._id,
          INTERVIEW_EVENT_TYPES.SCREEN_SHARE_STARTED,
        );
      }
    });

    socket.on(SIGNALING_EVENTS.SCREEN_SHARE_STOPPED, async () => {
      if (socket.interviewId) {
        socket
          .to(`interview_${socket.interviewId}`)
          .emit(SIGNALING_EVENTS.SCREEN_SHARE_STOPPED, {
            socketId: socket.id,
            userId: socket.user._id,
          });
        await SignalingService.recordAuditEvent(
          socket.interviewId,
          socket.organizationId,
          socket.user._id,
          INTERVIEW_EVENT_TYPES.SCREEN_SHARE_STOPPED,
        );
      }
    });

    // 4. In-Room Text Chat
    socket.on(
      SIGNALING_EVENTS.CHAT_MESSAGE,
      async ({ message, clientMsgId }) => {
        const msgId =
          clientMsgId ||
          `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const payload = {
          id: msgId,
          clientMsgId: msgId,
          senderId: socket.user._id,
          senderSocketId: socket.id,
          senderName:
            `${socket.user.firstName || ""} ${socket.user.lastName || ""}`.trim() ||
            (socket.userRole === "CANDIDATE" ? "Candidate" : "Examiner"),
          role:
            socket.userRole ||
            socket.user?.role ||
            (socket.user?.isGuest ? "CANDIDATE" : "EXAMINER"),
          message,
          timestamp: new Date(),
        };
        interviewNamespace
          .to(`interview_${socket.interviewId}`)
          .emit(SIGNALING_EVENTS.CHAT_MESSAGE, payload);
        await SignalingService.recordAuditEvent(
          socket.interviewId,
          socket.organizationId,
          socket.user._id,
          INTERVIEW_EVENT_TYPES.CHAT_MESSAGE,
          { message },
        );
      },
    );

    // 5. Session End Relay
    socket.on(SIGNALING_EVENTS.INTERVIEW_ENDED, async (data) => {
      if (socket.interviewId) {
        const roomId = `interview_${socket.interviewId}`;
        const reason =
          data?.reason || "The examiner has concluded the interview session.";
        interviewNamespace.to(roomId).emit(SIGNALING_EVENTS.INTERVIEW_ENDED, {
          endedBy: socket.user._id,
          reason,
        });
        socket.to(roomId).emit(SIGNALING_EVENTS.PARTICIPANT_LEFT, {
          socketId: socket.id,
          userId: socket.user._id,
          name:
            `${socket.user?.firstName || ""} ${socket.user?.lastName || ""}`.trim() ||
            "Examiner",
          role: socket.userRole || "EXAMINER",
          isHost: true,
        });

        try {
          if (
            socket.interviewId.length === 24 &&
            /^[0-9a-fA-F]{24}$/.test(socket.interviewId)
          ) {
            await Interview.findByIdAndUpdate(socket.interviewId, {
              status: "COMPLETED",
              endedAt: new Date(),
            });
          }
        } catch (dbErr) {
          logger.warn(
            `[SignalingServer] Failed to mark interview COMPLETED: ${dbErr.message}`,
          );
        }

        await SignalingService.recordAuditEvent(
          socket.interviewId,
          socket.organizationId,
          socket.user._id,
          INTERVIEW_EVENT_TYPES.INTERVIEW_COMPLETED,
          { concludedBy: socket.user._id },
        );
      }
    });

    // 6. Disconnect Cleanup
    socket.on("disconnect", async () => {
      const removed = SignalingService.unregisterParticipant(socket.id);
      const interviewId = removed?.interviewId || socket.interviewId;
      const participant = removed?.participant || {
        userId: socket.user?._id,
        name:
          `${socket.user?.firstName || ""} ${socket.user?.lastName || ""}`.trim() ||
          "User",
        role: socket.userRole || "EXAMINER",
      };

      if (interviewId) {
        const roomId = `interview_${interviewId}`;
        const isHost = participant.role !== "CANDIDATE";

        socket.to(roomId).emit(SIGNALING_EVENTS.PARTICIPANT_LEFT, {
          socketId: socket.id,
          userId: participant.userId,
          name: participant.name,
          role: participant.role,
          isHost,
        });

        // When a candidate leaves, notify room and queue that the viva seat is now available for the next candidate
        if (!isHost) {
          interviewNamespace.to(roomId).emit("interview:room_available", {
            interviewId,
            freedBy: participant.userId,
          });
        } else {
          // If the examiner/host temporarily disconnects/steps out, inform room peers
          interviewNamespace.to(roomId).emit("interview:host_stepped_out", {
            hostId: participant.userId,
            message: "The examiner stepped away and will rejoin shortly.",
          });
        }

        if (socket.organizationId) {
          await SignalingService.recordAuditEvent(
            interviewId,
            socket.organizationId,
            participant.userId,
            INTERVIEW_EVENT_TYPES.PARTICIPANT_LEFT,
            { socketId: socket.id, isHost },
          );
        }
      }
    });
  });

  logger.info(
    "[SignalingServer] WebRTC signaling attached to namespace /interviews",
  );
};
