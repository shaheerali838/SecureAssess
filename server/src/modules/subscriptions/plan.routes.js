import express from "express";
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
} from "./plan.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router();

// GET /api/v1/plans - List public active plans (or all for platform owner/admin)
router.get("/", getPlans);

// GET /api/v1/plans/:planId - View single plan
router.get("/:planId", getPlanById);

// POST /api/v1/plans - Create new subscription plan (Platform only)
router.post(
  "/",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.PLANS_MANAGE || PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  createPlan
);

// PATCH /api/v1/plans/:planId - Update plan (Platform only)
router.patch(
  "/:planId",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.PLANS_MANAGE || PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  updatePlan
);

export default router;
