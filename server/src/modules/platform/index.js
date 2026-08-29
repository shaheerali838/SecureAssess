import express from "express";
import { getPlatformDashboard } from "../reports/report.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router();

// GET /api/v1/platform/reports/dashboard - Platform Owner/Admin dashboard metrics
router.get(
  "/reports/dashboard",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.REPORTS_VIEW),
  getPlatformDashboard
);

router.get("/", (req, res) => {
  res.json({ success: true, message: "platform module initialized" });
});

export default router;
