import mongoose from "mongoose";
import { ENV } from "./env.js";
import { logger } from "./logger.js";

const mongooseOptions = {
  dbName: ENV.MONGODB_DB_NAME,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  minPoolSize: 5,
  autoIndex: ENV.NODE_ENV !== "production",
};

const maskUri = (uri) => {
  if (!uri) return "";
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
};

mongoose.connection.on("connected", () => {
  // Silent or minimal
});

mongoose.connection.on("error", (err) => {
  logger.error(`Database error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Database connection closed");
});

export const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, mongooseOptions);
    logger.info(
      `MongoDB connected -> ${conn.connection.host} [${conn.connection.name}]`
    );
    return conn;
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close(false);
  } catch (error) {
    logger.error(`Error closing database connection: ${error.message}`);
  }
};
