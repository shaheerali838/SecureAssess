import { ENV } from "./env.js";

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowlist = (ENV.CORS_ORIGIN || "*")
      .split(",")
      .map((item) => item.trim());

    if (allowlist.includes("*") || allowlist.includes(origin)) {
      return callback(null, true);
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
