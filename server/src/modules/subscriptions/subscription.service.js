import mongoose from "mongoose";
import Subscription from "./subscription.model.js";
import Organization from "../organizations/organization.model.js";
import { MockBillingProvider } from "../../services/billing/billingProvider.service.js";
import { EntitlementService } from "../../services/billing/entitlement.service.js";
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  PLAN_CONFIGURATIONS,
} from "../../constants/subscriptionPlans.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { ApiError } from "../../utils/ApiError.js";

const billingProvider = new MockBillingProvider();

export class SubscriptionService {
  /**
   * Retrieves active subscription for an organization
   */
  static async getCurrentSubscription(organizationId) {
    return EntitlementService.getOrganizationSubscription(organizationId);
  }

  /**
   * Retrieves comprehensive usage & entitlements
   */
  static async getUsageAndEntitlements(organizationId) {
    return EntitlementService.getUsageOverview(organizationId);
  }

  /**
   * Upgrades or downgrades an organization's subscription plan
   */
  static async changePlan(organizationId, newPlan, customLimits = null, userId = null) {
    if (!PLAN_CONFIGURATIONS[newPlan]) {
      throw new ApiError(400, `Invalid subscription plan: '${newPlan}'`);
    }

    const subscription = await EntitlementService.getOrganizationSubscription(organizationId);
    const oldPlan = subscription.plan;
    const planConfig = PLAN_CONFIGURATIONS[newPlan];

    subscription.plan = newPlan;
    subscription.status = SUBSCRIPTION_STATUSES.ACTIVE;
    subscription.limits = {
      ...planConfig.limits,
      ...(customLimits || {}),
    };
    subscription.features = {
      ...planConfig.features,
    };
    subscription.cancelAtPeriodEnd = false;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await subscription.save();

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "SUBSCRIPTION",
      resourceId: subscription._id,
      description: `Changed subscription plan from '${oldPlan}' to '${newPlan}'`,
    }).catch(() => {});

    return subscription;
  }

  /**
   * Cancels subscription
   */
  static async cancelSubscription(organizationId, atPeriodEnd = true, userId = null) {
    const subscription = await EntitlementService.getOrganizationSubscription(organizationId);

    if (atPeriodEnd) {
      subscription.cancelAtPeriodEnd = true;
    } else {
      subscription.status = SUBSCRIPTION_STATUSES.CANCELLED;
      subscription.cancelledAt = new Date();
    }

    await subscription.save();

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "CANCEL",
      resource: "SUBSCRIPTION",
      resourceId: subscription._id,
      description: `Subscription cancelled (atPeriodEnd: ${atPeriodEnd})`,
    }).catch(() => {});

    return subscription;
  }

  /**
   * Webhook processor with signature verification and idempotency check
   */
  static async processWebhook(rawPayload, signature, secret = "mock_webhook_secret_key_123") {
    const payloadStr = typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload);
    const parsedPayload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;

    const isValidSignature = billingProvider.verifyWebhookSignature(payloadStr, signature, secret);
    if (!isValidSignature) {
      throw new ApiError(400, "Invalid webhook signature");
    }

    const { id: eventId, type: eventType, data } = parsedPayload;

    if (!eventId || !eventType) {
      throw new ApiError(400, "Invalid webhook event payload");
    }

    const { organizationId, plan, status } = data?.object || {};
    if (!organizationId) {
      return { received: true, processed: false, reason: "No organizationId in event" };
    }

    // Idempotency: Check if event was already processed
    const existing = await Subscription.findOne({
      organizationId,
      processedWebhookEvents: eventId,
    });

    if (existing) {
      return { received: true, processed: true, idempotencyDeduplicated: true };
    }

    // Update Subscription based on event
    const subscription = await EntitlementService.getOrganizationSubscription(organizationId);

    if (eventType === "invoice.payment_succeeded" || eventType === "customer.subscription.updated") {
      if (plan && PLAN_CONFIGURATIONS[plan]) {
        subscription.plan = plan;
        subscription.limits = PLAN_CONFIGURATIONS[plan].limits;
        subscription.features = PLAN_CONFIGURATIONS[plan].features;
      }
      if (status) {
        subscription.status = status;
      }
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (eventType === "customer.subscription.deleted") {
      subscription.status = SUBSCRIPTION_STATUSES.CANCELLED;
      subscription.cancelledAt = new Date();
    }

    subscription.processedWebhookEvents.push(eventId);
    await subscription.save();

    AuditLogService.createAuditLog({
      organizationId,
      actorId: null,
      action: "UPDATE",
      resource: "BILLING_WEBHOOK",
      resourceId: subscription._id,
      description: `Processed billing webhook '${eventType}' (Event ID: ${eventId})`,
    }).catch(() => {});

    return { received: true, processed: true, eventId };
  }

  /**
   * Platform Owner: List all subscriptions across organizations
   */
  static async getAllSubscriptions(query = {}) {
    const filter = {};
    if (query.plan) filter.plan = query.plan;
    if (query.status) filter.status = query.status;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Subscription.find(filter)
        .populate("organizationId", "name slug code status type")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Platform Owner: Modify subscription status / trial period
   */
  static async updateSubscriptionStatus(subscriptionId, { status, extendTrialDays = 0 }, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      throw new ApiError(400, "Invalid subscription ID format");
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new ApiError(404, "Subscription not found");
    }

    if (status) subscription.status = status;
    if (extendTrialDays > 0) {
      subscription.trialEndsAt = new Date(
        new Date(subscription.trialEndsAt || Date.now()).getTime() + extendTrialDays * 24 * 60 * 60 * 1000
      );
      subscription.status = SUBSCRIPTION_STATUSES.TRIALING;
    }

    await subscription.save();

    AuditLogService.createAuditLog({
      organizationId: subscription.organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "SUBSCRIPTION",
      resourceId: subscription._id,
      description: `Platform Owner updated subscription status to '${subscription.status}'`,
    }).catch(() => {});

    return subscription;
  }

  /**
   * Platform Owner: Set custom limits for enterprise customers
   */
  static async setEnterpriseLimits(subscriptionId, { limits = {}, features = {} }, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      throw new ApiError(400, "Invalid subscription ID format");
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new ApiError(404, "Subscription not found");
    }

    subscription.plan = SUBSCRIPTION_PLANS.CUSTOM;
    subscription.limits = {
      ...subscription.limits.toObject(),
      ...limits,
    };
    subscription.features = {
      ...subscription.features.toObject(),
      ...features,
    };

    await subscription.save();

    AuditLogService.createAuditLog({
      organizationId: subscription.organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "SUBSCRIPTION",
      resourceId: subscription._id,
      description: `Platform Owner configured custom enterprise limits`,
    }).catch(() => {});

    return subscription;
  }
}
