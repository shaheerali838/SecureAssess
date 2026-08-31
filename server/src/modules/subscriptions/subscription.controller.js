import { SubscriptionService } from "./subscription.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getCurrentSubscription = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId;
  const result = await SubscriptionService.getCurrentSubscription(organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Subscription retrieved successfully"));
});

export const getUsageAndEntitlements = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId;
  const result = await SubscriptionService.getUsageAndEntitlements(organizationId);
  return res.status(200).json(new ApiResponse(200, result, "Usage overview retrieved successfully"));
});

export const changePlan = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;
  const userId = req.user?.id || req.user?._id;
  const { plan, customLimits } = req.body;

  const result = await SubscriptionService.changePlan(
    organizationId,
    plan,
    customLimits,
    userId
  );
  return res.status(200).json(new ApiResponse(200, result, "Subscription plan updated successfully"));
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;
  const userId = req.user?.id || req.user?._id;
  const { atPeriodEnd = true } = req.body;

  const result = await SubscriptionService.cancelSubscription(
    organizationId,
    atPeriodEnd,
    userId
  );
  return res.status(200).json(new ApiResponse(200, result, "Subscription cancelled successfully"));
});

export const reactivateSubscription = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId;
  const userId = req.user?.id || req.user?._id;

  const result = await SubscriptionService.reactivateSubscription(
    organizationId,
    userId
  );
  return res.status(200).json(new ApiResponse(200, result, "Subscription reactivated successfully"));
});

export const handleBillingWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-billing-signature"] || req.headers["stripe-signature"] || "";
  const result = await SubscriptionService.processWebhook(req.body, signature);
  return res.status(200).json(new ApiResponse(200, result, "Webhook processed successfully"));
});

// Platform Owner Handlers
export const getAllSubscriptions = asyncHandler(async (req, res) => {
  const result = await SubscriptionService.getAllSubscriptions(req.query);
  return res.status(200).json(new ApiResponse(200, result, "Platform subscriptions retrieved"));
});

export const updateSubscriptionStatus = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await SubscriptionService.updateSubscriptionStatus(
    subscriptionId,
    req.body,
    userId
  );
  return res.status(200).json(new ApiResponse(200, result, "Subscription status updated"));
});

export const setEnterpriseLimits = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const userId = req.user?.id || req.user?._id;
  const result = await SubscriptionService.setEnterpriseLimits(
    subscriptionId,
    req.body,
    userId
  );
  return res.status(200).json(new ApiResponse(200, result, "Enterprise limits configured"));
});
