import express from "express";
import mongoose from "mongoose";
import authRoutes from "../../modules/auth/auth.routes.js";
import usersRoutes from "../../modules/users/index.js";
import assessmentsRoutes from "../../modules/assessments/index.js";
import attemptsRoutes from "../../modules/attempts/index.js";
import proctoringRoutes from "../../modules/proctoring/index.js";
import resultsRoutes from "../../modules/results/index.js";
import organizationsRoutes from "../../modules/organizations/index.js";
import questionBankRoutes from "../../modules/questionBank/index.js";
import platformRoutes from "../../modules/platform/index.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const router = express.Router();

// Health Check Endpoint
router.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const statusData = {
    application: "healthy",
    database: isDbConnected ? "connected" : "disconnected",
  };

  const statusCode = isDbConnected ? 200 : 503;
  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, statusData, "Platform health status"));
});

// Core API v1 routes
router.use("/platform", platformRoutes);
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/assessments", assessmentsRoutes);
router.use("/attempts", attemptsRoutes);
router.use("/proctoring", proctoringRoutes);
router.use("/results", resultsRoutes);
router.use("/organizations", organizationsRoutes);
router.use("/questions", questionBankRoutes);

export default router;
