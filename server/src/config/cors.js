import { ENV } from "./env.js";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://secure-assess.vercel.app",
  "https://secure-assess-server.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:7000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:7000",
];

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowlist = (ENV.CORS_ORIGIN || "*")
      .split(",")
      .map((item) => item.trim().replace(/\/$/, ""));

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (
      allowlist.includes("*") ||
      allowlist.includes(normalizedOrigin) ||
      DEFAULT_ALLOWED_ORIGINS.includes(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    // Automatically allow all Vercel deployment & preview branch domains
    try {
      const parsedUrl = new URL(origin);
      if (
        parsedUrl.hostname.endsWith(".vercel.app") ||
        parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1"
      ) {
        return callback(null, true);
      }
    } catch {
      // ignore invalid URL format
    }

    if (ENV.NODE_ENV === "production") {
      return callback(
        new Error(`CORS origin '${origin}' not permitted`),
        false,
      );
    }

    // Permissive in development/testing
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-tenant-id",
    "x-organization-id",
    "X-Organization-Id",
    "X-Tenant-Id",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["x-organization-id", "x-tenant-id", "Authorization"],
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 204,
};
