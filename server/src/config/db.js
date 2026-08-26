import mongoose from "mongoose";
import { ENV } from "./env.js";
import { logger } from "./logger.js";

/**
 * Modern Mongoose Connection Configuration (Mongoose 8+)
 * Deprecated options like `useNewUrlParser`, `useUnifiedTopology`, `useCreateIndex` are omitted.
 */
const mongooseOptions = {
  dbName: ENV.MONGODB_DB_NAME,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  maxPoolSize: 50, // Maintain up to 50 socket connections
  minPoolSize: 5, // Maintain at least 5 socket connections
  autoIndex: ENV.NODE_ENV !== "production", // Build indexes automatically only in dev
};

/**
 * Register connection lifecycle event listeners
 */
mongoose.connection.on("connected", () => {
  logger.info("[Database] Mongoose default connection open");
});

mongoose.connection.on("error", (err) => {
  logger.error(`[Database] Mongoose connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("[Database] Mongoose connection disconnected");
});

mongoose.connection.on("reconnected", () => {
  logger.info("[Database] Mongoose reconnected successfully");
});

/**
 * Establishes MongoDB connection.
 * Fails fast and throws on failure to abort application startup.
 */
export const connectDatabase = async () => {
  try {
    logger.info(`[Database] Attempting connection to ${ENV.MONGODB_URI}`);

    const conn = await mongoose.connect(ENV.MONGODB_URI, mongooseOptions);

    logger.info(
      `[Database] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    logger.error(`[Database] Fatal: Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Gracefully closes the MongoDB connection during process termination
 */
export const disconnectDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
      logger.info("[Database] Mongoose connection closed successfully.");
    }
  } catch (error) {
    logger.error(`[Database] Error while closing Mongoose connection: ${error.message}`);
  }
};

export default connectDatabase;
