import mongoose from "mongoose";
import Subscription from "./subscription.model.js";
import Plan from "./plan.model.js";
import Organization from "../organizations/organization.model.js";
import { UsageService } from "./usage.service.js";
import {
  SUBSCRIPTION_STATUSES,
  DEFAULT_PLANS,
} from "./subscription.constants.js";
import { ApiError } from "../../utils/ApiError.js";

export class EntitlementService {
  /**
   * Resolves or auto-provisions the active subscription and plan for an organization
   */
  static async getOrganizationSubscription(organizationId) {
    let orgId = organizationId;
    if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
      const firstOrg = await Organization.findOne({ status: "ACTIVE" });
      if (firstOrg) {
        orgId = firstOrg._id;
      } else {
        throw new ApiError(400, "Organization context is required to resolve subscription");
      }
    }

    let subscription = await Subscription.findOne({ organizationId: orgId }).populate("planId");

    if (!subscription) {
      // Find or create default FREE/TRIAL plan
      let defaultPlan = await Plan.findOne({ code: "STARTER" });
      if (!defaultPlan) {
        defaultPlan = await Plan.create(DEFAULT_PLANS.STARTER);
      }

      try {
        subscription = await Subscription.findOneAndUpdate(
          { organizationId: orgId },
          {
            $setOnInsert: {
              organizationId: orgId,
              planId: defaultPlan._id,
              planCode: defaultPlan.code,
              plan: defaultPlan.code,
              status: SUBSCRIPTION_STATUSES.TRIALING,
              limits: defaultPlan.limits,
              features: defaultPlan.features,
              price: defaultPlan.price,
              currency: defaultPlan.currency,
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          },
          { upsert: true, returnDocument: "after" }
        ).populate("planId");
      } catch {
        subscription = await Subscription.findOne({ organizationId: orgId }).populate("planId");
      }
    }

    // Check trial expiration
    if (
      subscription &&
      subscription.status === SUBSCRIPTION_STATUSES.TRIALING &&
      subscription.trialEndsAt &&
      new Date(subscription.trialEndsAt) < new Date()
    ) {
      subscription.status = SUBSCRIPTION_STATUSES.EXPIRED;
      await subscription.save().catch(() => {});
    }

    return subscription;
  }

  /**
   * Deterministically returns whether a feature is permitted
   */
  static async canUseFeature(organizationId, featureKey) {
    try {
      await this.checkFeatureEntitlement(organizationId, featureKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verifies if a specific feature is enabled in the organization's plan, throwing ApiError if denied
   */
  static async checkFeatureEntitlement(organizationId, featureKey) {
    const subscription = await this.getOrganizationSubscription(organizationId);

    if (
      subscription.status === SUBSCRIPTION_STATUSES.EXPIRED ||
      subscription.status === SUBSCRIPTION_STATUSES.CANCELLED
    ) {
      throw new ApiError(
        403,
        `Subscription is ${subscription.status}. Please reactivate or upgrade your subscription plan to access '${featureKey}'.`,
        {
          code: "SUBSCRIPTION_INACTIVE",
          status: subscription.status,
          plan: subscription.planCode || subscription.plan,
          upgradeRequired: true,
        }
      );
    }

    const isEnabled = Boolean(subscription.features?.[featureKey]);
    if (!isEnabled) {
      throw new ApiError(
        403,
        `The '${featureKey}' feature is not included in your current plan (${subscription.planCode || subscription.plan}). Please upgrade to access this feature.`,
        {
          code: "FEATURE_NOT_ENTITLED",
          feature: featureKey,
          plan: subscription.planCode || subscription.plan,
          upgradeRequired: true,
        }
      );
    }

    return { allowed: true, plan: subscription.planCode || subscription.plan, feature: featureKey };
  }

  /**
   * Deterministically asserts resource limit against authoritative database records
   */
  static async assertWithinLimit(organizationId, resourceKey) {
    return this.checkUsageLimit(organizationId, resourceKey);
  }

  /**
   * Verifies consumption limit against authoritative database records
   */
  static async checkUsageLimit(organizationId, resourceKey) {
    const subscription = await this.getOrganizationSubscription(organizationId);

    if (
      subscription.status === SUBSCRIPTION_STATUSES.EXPIRED ||
      subscription.status === SUBSCRIPTION_STATUSES.CANCELLED
    ) {
      throw new ApiError(
        403,
        `Subscription is ${subscription.status}. Please reactivate your subscription to perform this action.`,
        {
          code: "SUBSCRIPTION_INACTIVE",
          status: subscription.status,
          plan: subscription.planCode || subscription.plan,
          upgradeRequired: true,
        }
      );
    }

    // Resolve limit configuration key
    let limit = subscription.limits?.[resourceKey];
    if (limit === undefined) {
      const normalizedKey = resourceKey.startsWith("max")
        ? resourceKey
        : `max${resourceKey.charAt(0).toUpperCase()}${resourceKey.slice(1)}`;
      limit = subscription.limits?.[normalizedKey];
    }

    if (limit === undefined || limit === -1) {
      return { allowed: true, currentUsage: 0, limit: -1, plan: subscription.planCode || subscription.plan };
    }

    const currentUsage = await UsageService.calculateResourceUsage(organizationId, resourceKey);

    if (currentUsage >= limit) {
      throw new ApiError(
        403,
        `You have reached the maximum limit (${limit}) for '${resourceKey}' under your current plan (${subscription.planCode || subscription.plan}). Please upgrade to continue.`,
        {
          code: "SUBSCRIPTION_LIMIT_REACHED",
          resource: resourceKey,
          currentUsage,
          limit,
          plan: subscription.planCode || subscription.plan,
          upgradeRequired: true,
        }
      );
    }

    return { allowed: true, currentUsage, limit, plan: subscription.planCode || subscription.plan };
  }

  /**
   * Retrieves complete usage and entitlement dashboard for an organization
   */
  static async getUsageOverview(organizationId) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    const usage = await UsageService.getOrganizationUsageMetrics(organizationId);

    return {
      subscription: {
        id: subscription._id,
        planId: subscription.planId?._id || subscription.planId,
        planCode: subscription.planCode || subscription.plan,
        plan: subscription.planCode || subscription.plan,
        status: subscription.status,
        billingInterval: subscription.billingInterval,
        price: subscription.price,
        currency: subscription.currency,
        startedAt: subscription.startedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      limits: subscription.limits,
      features: subscription.features,
      usage: {
        candidates: { used: usage.candidates, limit: subscription.limits?.maxCandidates ?? subscription.limits?.candidates },
        assessments: { used: usage.assessments, limit: subscription.limits?.maxAssessments ?? subscription.limits?.assessments },
        questions: { used: usage.questions, limit: subscription.limits?.maxQuestions ?? subscription.limits?.questions },
        users: { used: usage.users, limit: subscription.limits?.maxUsers ?? subscription.limits?.staffUsers },
        interviews: { used: usage.interviews, limit: subscription.limits?.maxInterviews ?? subscription.limits?.interviews },
        attempts: { used: usage.attempts, limit: subscription.limits?.maxAttempts ?? subscription.limits?.monthlyAttempts },
      },
    };
  }
}
