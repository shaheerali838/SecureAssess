import express from "express";
import cors from "cors";
import path from "path";
import { corsOptions } from "./config/cors.js";
import { securityHeaders } from "./middleware/security.middleware.js";
import { rateLimiter } from "./middleware/rateLimit.middleware.js";
import { tenantMiddleware } from "./middleware/tenant.middleware.js";
import { requestIdMiddleware } from "./middleware/requestId.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import rootRoutes from "./routes/index.js";

const app = express();

// Global Middlewares
app.use(requestIdMiddleware);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(rateLimiter({ windowMs: 60 * 1000, max: 200 }));
app.use(tenantMiddleware);

// Static uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Root Health Check Probes for Orchestrators (Kubernetes / Load Balancers)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "HEALTHY", timestamp: new Date().toISOString() });
});
app.get("/health/live", (req, res) => {
  res.status(200).json({ status: "LIVE", uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});
app.get("/health/ready", (req, res) => {
  res.status(200).json({ status: "READY", timestamp: new Date().toISOString() });
});

// Mount API routes
app.use("/api", rootRoutes);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
