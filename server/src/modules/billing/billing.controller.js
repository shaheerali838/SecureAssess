import { BillingService } from "./billing.service.js";
import { BillingReconciliationService } from "./billing.reconciliation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.body.organizationId;
  const userId = req.user?.id || req.user?._id;
  const { planCode, planId, billingInterval, successUrl, cancelUrl } = req.body;

  const result = await BillingService.createCheckoutSession({
    organizationId,
    planCodeOrId: planId || planCode,
    billingInterval,
    userId,
    successUrl,
    cancelUrl,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Checkout session created successfully"));
});

export const createBillingPortalSession = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;
  const { returnUrl } = req.body;

  const result = await BillingService.createBillingPortalSession(organizationId, returnUrl);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Billing portal session created successfully"));
});

export const getBillingSummary = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;

  const result = await BillingService.getBillingSummary(organizationId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Billing summary retrieved successfully"));
});

export const getInvoices = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;

  const result = await BillingService.getInvoices(organizationId, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Invoices retrieved successfully"));
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;
  const userId = req.user?.id || req.user?._id;
  const { atPeriodEnd = true } = req.body;

  const result = await BillingService.cancelSubscription(organizationId, atPeriodEnd, userId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Subscription cancelled successfully"));
});

export const reactivateSubscription = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;
  const userId = req.user?.id || req.user?._id;

  const result = await BillingService.reactivateSubscription(organizationId, userId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Subscription reactivated successfully"));
});

export const reconcileBilling = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;
  const userId = req.user?.id || req.user?._id;

  const result = await BillingReconciliationService.reconcileSubscription(organizationId, userId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Billing reconciled successfully"));
});

export const handleWebhook = asyncHandler(async (req, res) => {
  const signature =
    req.headers["x-billing-signature"] ||
    req.headers["stripe-signature"] ||
    "";
  const result = await BillingService.processWebhook(req.body, signature);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Webhook processed successfully"));
});
