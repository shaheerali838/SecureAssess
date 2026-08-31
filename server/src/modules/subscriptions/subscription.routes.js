import express from "express";
import {
  getCurrentSubscription,
  getUsageAndEntitlements,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  handleBillingWebhook,
  getAllSubscriptions,
  updateSubscriptionStatus,
  setEnterpriseLimits,
} from "./subscription.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import {
  requirePlatformPermission,
  requireOrganizationOrPlatformPermission,
} from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Public Webhook Endpoint ---
router.post("/webhooks/provider", handleBillingWebhook);
router.post("/webhook", handleBillingWebhook);

// --- Organization Subscription Endpoints ---
router.get(
  "/current",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_VIEW
  ),
  getCurrentSubscription
);

router.get(
  "/usage",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_VIEW
  ),
  getUsageAndEntitlements
);

router.get(
  "/entitlements",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_VIEW
  ),
  getUsageAndEntitlements
);

router.post(
  "/change-plan",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    PERMISSIONS.SUBSCRIPTIONS_MANAGE
  ),
  changePlan
);

router.post(
  "/cancel",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    PERMISSIONS.SUBSCRIPTIONS_MANAGE
  ),
  cancelSubscription
);

router.post(
  "/reactivate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    PERMISSIONS.SUBSCRIPTIONS_MANAGE
  ),
  reactivateSubscription
);

// --- Platform Administration Endpoints ---
router.get(
  "/platform/all",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.SUBSCRIPTIONS_VIEW),
  getAllSubscriptions
);

router.patch(
  "/platform/:subscriptionId/status",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  updateSubscriptionStatus
);

router.patch(
  "/platform/:subscriptionId/enterprise-limits",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.SUBSCRIPTIONS_MANAGE),
  setEnterpriseLimits
);

export default router;
