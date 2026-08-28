import { ENV } from "./env.js";

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl) or matching origins
    if (
      !origin ||
      ENV.CORS_ORIGIN === "*" ||
      ENV.CORS_ORIGIN.split(",").includes(origin)
    ) {
      callback(null, true);
    } else {
      // Permissive in development for local frontend testing
      callback(null, true);
    }
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
