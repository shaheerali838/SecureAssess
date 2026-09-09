import mongoose from "mongoose";
import { ENV } from "./env.js";
import { logger } from "./logger.js";

const mongooseOptions = {
  dbName: ENV.MONGODB_DB_NAME,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50,
  minPoolSize: 1,
  autoIndex: ENV.NODE_ENV !== "production",
};

// Global cache for Serverless environments (e.g. Vercel / AWS Lambda)
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

mongoose.connection.on("error", (err) => {
  logger.error(`Database error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Database connection closed");
});

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(ENV.MONGODB_URI, mongooseOptions).then((m) => {
      logger.info(
        `MongoDB connected -> ${m.connection.host} [${m.connection.name}]`
      );
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    logger.error(`Database connection failed: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

export const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close(false);
    cached.conn = null;
    cached.promise = null;
  } catch (error) {
    logger.error(`Error closing database connection: ${error.message}`);
  }
};
