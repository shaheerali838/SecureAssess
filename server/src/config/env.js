import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Automatically resolve .env from server directory or project root
const serverEnvPath = path.resolve(process.cwd(), "server", ".env");
const rootEnvPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

export const ENV = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "7000", 10),
  MONGODB_URI:
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    "mongodb://127.0.0.1:27017/secureassess",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "secureassess",
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret_change_in_production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // Storage & Media
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  // Email Service
  SMTP_HOST: process.env.SMTP_HOST || "smtp.mailtrap.io",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@secureassess.com",

  // Initial Platform Owner Admin Configuration
  ADMIN_FIRST_NAME: process.env.ADMIN_FIRST_NAME || "Platform",
  ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME || "Owner",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "owner@secureassess.com",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "Admin@123",
  ADMIN_PHONE: process.env.ADMIN_PHONE || "",

  // Redis Cache
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
});
