import { ENV } from "./env.js";

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

    if (allowlist.includes("*") || allowlist.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Automatically allow all vercel deployment & preview domains
    try {
      const parsedUrl = new URL(origin);
      if (parsedUrl.hostname.endsWith(".vercel.app") || parsedUrl.hostname === "localhost") {
        return callback(null, true);
      }
    } catch {
      // ignore invalid URL
    }

    if (ENV.NODE_ENV === "production") {
      return callback(new Error(`CORS origin '${origin}' not permitted`), false);
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
  exposedHeaders: ["x-organization-id", "x-tenant-id"],
};
