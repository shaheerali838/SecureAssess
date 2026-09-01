import express from "express";
import mongoose from "mongoose";
import authRoutes from "../../modules/auth/auth.routes.js";
import usersRoutes from "../../modules/users/index.js";
import assessmentsRoutes from "../../modules/assessments/index.js";
import attemptsRoutes from "../../modules/attempts/index.js";
import proctoringRoutes from "../../modules/proctoring/index.js";
import resultsRoutes from "../../modules/results/index.js";
import organizationsRoutes from "../../modules/organizations/index.js";
import questionBankRoutes, { questionRouter } from "../../modules/questionBank/index.js";
import interviewsRoutes from "../../modules/interviews/index.js";
import platformRoutes from "../../modules/platform/index.js";
import notificationsRoutes from "../../modules/notifications/index.js";
import evaluationsRoutes from "../../modules/evaluations/index.js";
import reportsRoutes from "../../modules/reports/index.js";
import auditLogRoutes from "../../modules/auditLogs/index.js";
import subscriptionsRoutes from "../../modules/subscriptions/index.js";
import planRoutes from "../../modules/subscriptions/plan.routes.js";
import billingRoutes from "../../modules/billing/index.js";
import candidatesRoutes from "../../modules/candidates/index.js";
import questionCategoriesRoutes from "../../modules/questionCategories/index.js";
import questionTagsRoutes from "../../modules/questionTags/index.js";
import departmentsRoutes from "../../modules/departments/index.js";
import programsRoutes from "../../modules/programs/index.js";
import subjectsRoutes from "../../modules/subjects/index.js";
import candidateGroupsRoutes from "../../modules/candidateGroups/index.js";
import rubricsRoutes from "../../modules/rubrics/index.js";
import { verifyPublicCertificate } from "../../modules/certificates/certificate.controller.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const router = express.Router();

// Health Check Endpoints (General, Liveness & Readiness)
router.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusData = {
    status: isDbConnected ? "HEALTHY" : "DEGRADED",
    application: "SecureAssess API",
    database: isDbConnected ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  const statusCode = isDbConnected ? 200 : 503;
  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, statusData, "Platform health status"));
});

router.get("/health/live", (req, res) => {
  return res.status(200).json(
    new ApiResponse(
      200,
      { status: "LIVE", uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() },
      "Liveness probe ok"
    )
  );
});

router.get("/health/ready", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusCode = isDbConnected ? 200 : 503;
  return res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      {
        status: isDbConnected ? "READY" : "NOT_READY",
        database: isDbConnected ? "CONNECTED" : "DISCONNECTED",
        timestamp: new Date().toISOString(),
      },
      isDbConnected ? "Readiness probe ok" : "Dependencies unavailable"
    )
  );
});

// Public Credential Verification Endpoint
router.get(
  "/public/certificates/verify/:verificationCode",
  verifyPublicCertificate,
);
router.get("/verify/certificates/:verificationCode", verifyPublicCertificate);
router.get("/verify/certificate/:verificationCode", verifyPublicCertificate);
router.get("/certificates/verify/:verificationCode", verifyPublicCertificate);

// Core API v1 routes
router.use("/platform", platformRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/assessments", assessmentsRoutes);
router.use("/attempts", attemptsRoutes);
router.use("/evaluations", evaluationsRoutes);
router.use("/proctoring", proctoringRoutes);
router.use("/results", resultsRoutes);
router.use("/organizations", organizationsRoutes);
router.use("/questions", questionRouter);
router.use("/question-banks", questionBankRoutes);
router.use("/question-categories", questionCategoriesRoutes);
router.use("/question-tags", questionTagsRoutes);
router.use("/departments", departmentsRoutes);
router.use("/programs", programsRoutes);
router.use("/subjects", subjectsRoutes);
router.use("/candidate-groups", candidateGroupsRoutes);
router.use("/rubrics", rubricsRoutes);
router.use("/interviews", interviewsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/subscriptions", subscriptionsRoutes);
router.use("/plans", planRoutes);
router.use("/billing", billingRoutes);
router.use("/candidate-portal", candidatesRoutes);
router.use("/candidates", candidatesRoutes);
router.use("/reports", reportsRoutes);
router.use("/audit-logs", auditLogRoutes);

export default router;
