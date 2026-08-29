import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { ENV } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { logger } from "./config/logger.js";

import { attachInterviewSignaling } from "./modules/interviews/index.js";

const server = http.createServer(app);

// Socket.io WebRTC & Proctoring Signaling Server
const io = new SocketIOServer(server, {
  cors: corsOptions,
});

// Attach specialized WebRTC interview signaling namespace (/interviews)
attachInterviewSignaling(io);

io.on("connection", (socket) => {
  logger.info(`[Socket] Client connected: ${socket.id}`);

  // Interview & Assessment Room Signaling
  socket.on("join-room", ({ roomId, userId, role }) => {
    socket.join(roomId);
    logger.info(`[Socket] User ${userId} (${role}) joined room ${roomId}`);
    socket.to(roomId).emit("user-joined", { userId, role, socketId: socket.id });
  });

  // WebRTC Offer/Answer/ICE
  socket.on("signal", ({ roomId, signal, targetSocketId }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit("signal", { signal, senderSocketId: socket.id });
    } else {
      socket.to(roomId).emit("signal", { signal, senderSocketId: socket.id });
    }
  });

  // Proctoring Violations / Events
  socket.on("proctor-event", ({ roomId, eventType, timestamp, metadata }) => {
    logger.warn(`[Proctor] Violation detected in room ${roomId}: ${eventType}`);
    socket.to(roomId).emit("candidate-flagged", { eventType, timestamp, metadata });
  });

  socket.on("disconnect", () => {
    logger.info(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Bootstrapping: Connect Database -> Start HTTP & Socket Server (Fail Fast)
const startServer = async () => {
  try {
    // 1. Establish Database Connection First
    await connectDatabase();

    // 2. Only start HTTP & WebSocket listeners once DB is ready
    server.listen(ENV.PORT, () => {
      logger.info(
        `[Server] SecureAssess backend running on port ${ENV.PORT} in ${ENV.NODE_ENV} mode`
      );
    });
  } catch (error) {
    logger.error(
      "[Server] Critical startup error: Database connection failed. Aborting startup."
    );
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`[Server] Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    logger.info("[Server] HTTP and Socket server closed.");
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
