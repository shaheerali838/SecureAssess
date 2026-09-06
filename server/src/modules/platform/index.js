import express from "express";
import { getPlatformDashboard } from "../reports/report.controller.js";
import {
  getPlatformSecurity,
  getPlatformAuditLogs,
  getPlatformAccess,
  getPlatformMonitoring,
  getPlatformServicesHealth,
  getPlatformPlans,
  getPlatformBilling,
  getPlatformSettings,
  updatePlatformSettings,
} from "./platform.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router();

// Middleware: All platform routes require authentication & platform-scope permissions
router.use(
  requireAuth,
  requirePlatformPermission(
    PERMISSIONS.PLATFORM_VIEW,
    PERMISSIONS.PLATFORM_ANALYTICS_VIEW,
    PERMISSIONS.PLATFORM_MONITORING_VIEW
  )
);

// 1. Platform Dashboard Overview
router.get("/reports/dashboard", getPlatformDashboard);

// 2. Security Center & Threat Ingestion
router.get("/security", getPlatformSecurity);

// 3. Multi-Tenant Global Audit Logs
router.get("/audit-logs", getPlatformAuditLogs);

// 4. Platform Access & Administrator Directory
router.get("/access", getPlatformAccess);

// 5. System Compute & Node Monitoring
router.get("/monitoring", getPlatformMonitoring);

// 6. Microservice Health Status
router.get("/services", getPlatformServicesHealth);

// 7. Subscription Plans & Entitlements
router.get("/plans", getPlatformPlans);

// 8. Platform Financials & Invoices
router.get("/billing", getPlatformBilling);

// 9. Platform Global Settings
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);

export default router;

