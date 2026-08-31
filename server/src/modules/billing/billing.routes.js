import express from "express";
import {
  createCheckoutSession,
  createBillingPortalSession,
  getBillingSummary,
  getInvoices,
  cancelSubscription,
  reactivateSubscription,
  reconcileBilling,
  handleWebhook,
} from "./billing.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Public Webhook Endpoint ---
router.post("/webhook", handleWebhook);
router.post("/webhooks/provider", handleWebhook);

// --- Authenticated Organization Endpoints ---
router.post(
  "/checkout",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_MANAGE
  ),
  createCheckoutSession
);

router.post(
  "/portal",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_MANAGE
  ),
  createBillingPortalSession
);

router.get(
  "/summary",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_VIEW
  ),
  getBillingSummary
);

router.get(
  "/invoices",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_VIEW
  ),
  getInvoices
);

router.post(
  "/subscription/cancel",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_MANAGE
  ),
  cancelSubscription
);

router.post(
  "/subscription/reactivate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_MANAGE
  ),
  reactivateSubscription
);

router.post(
  "/reconcile",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_MANAGE
  ),
  reconcileBilling
);

export default router;
