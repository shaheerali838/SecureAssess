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
  logger.debug(`Socket client connected: ${socket.id}`);

  // Interview & Assessment Room Signaling
  socket.on("join-room", ({ roomId, userId, role }) => {
    socket.join(roomId);
    socket
      .to(roomId)
      .emit("user-joined", { userId, role, socketId: socket.id });
  });

  // WebRTC Offer/Answer/ICE
  socket.on("signal", ({ roomId, signal, targetSocketId }) => {
    if (targetSocketId) {
      io.to(targetSocketId).emit("signal", {
        signal,
        senderSocketId: socket.id,
      });
    } else {
      socket.to(roomId).emit("signal", { signal, senderSocketId: socket.id });
    }
  });

  // Proctoring Violations / Events
  socket.on("proctor-event", ({ roomId, eventType, timestamp, metadata }) => {
    logger.warn(`Proctor violation in room ${roomId}: ${eventType}`);
    socket
      .to(roomId)
      .emit("candidate-flagged", { eventType, timestamp, metadata });
  });

  socket.on("disconnect", () => {
    logger.debug(`Socket client disconnected: ${socket.id}`);
  });
});

const printBanner = (port, env) => {
  const cyan = "\x1b[36m";
  const green = "\x1b[32m";
  const bold = "\x1b[1m";
  const dim = "\x1b[2m";
  const reset = "\x1b[0m";

  console.log(
    `\n  ${green}➜${reset}  ${bold}SecureAssess API:${reset} ${cyan}http://localhost:${port}/api/v1${reset}`,
  );
  console.log(
    `  ${green}➜${reset}  ${bold}Health:${reset}           ${cyan}http://localhost:${port}/api/v1/health${reset}`,
  );
  console.log(
    `  ${green}➜${reset}  ${bold}Signaling:${reset}        ${cyan}ws://localhost:${port}/interviews${reset}`,
  );
  console.log(
    `  ${green}➜${reset}  ${bold}Environment:${reset}      ${dim}${env}${reset}\n`,
  );
};

// Bootstrapping: Connect Database -> Start HTTP & Socket Server (Fail Fast)
const startServer = async () => {
  try {
    await connectDatabase();

    server.listen(ENV.PORT, () => {
      printBanner(ENV.PORT, ENV.NODE_ENV);
    });
  } catch (error) {
    logger.error(
      "Critical startup error: Database connection failed. Aborting startup.",
    );
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
