import mongoose from "mongoose";
import Subscription from "../../modules/subscriptions/subscription.model.js";
import Organization from "../../modules/organizations/organization.model.js";
import Candidate from "../../modules/candidates/candidate.model.js";
import Assessment from "../../modules/assessments/assessment.model.js";
import Interview from "../../modules/interviews/interview.model.js";
import UserMembership from "../../modules/users/userMembership.model.js";
import Attempt from "../../modules/attempts/attempt.model.js";
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
  PLAN_CONFIGURATIONS,
} from "../../constants/subscriptionPlans.js";
import { ApiError } from "../../utils/ApiError.js";

export class EntitlementService {
  /**
   * Resolves or auto-initializes the active subscription for an organization
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

    let subscription = await Subscription.findOne({ organizationId: orgId });

    if (!subscription) {
      const defaultPlan = PLAN_CONFIGURATIONS[SUBSCRIPTION_PLANS.FREE_TRIAL];
      try {
        subscription = await Subscription.findOneAndUpdate(
          { organizationId: orgId },
          {
            $setOnInsert: {
              organizationId: orgId,
              plan: SUBSCRIPTION_PLANS.FREE_TRIAL,
              status: SUBSCRIPTION_STATUSES.TRIALING,
              limits: defaultPlan.limits,
              features: defaultPlan.features,
              trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
          },
          { upsert: true, returnDocument: "after" }
        );
      } catch (err) {
        subscription = await Subscription.findOne({ organizationId: orgId });
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
   * Verifies if a specific feature is enabled in the organization's plan
   */
  static async checkFeatureEntitlement(organizationId, featureKey) {
    const subscription = await this.getOrganizationSubscription(organizationId);

    if (
      subscription.status === SUBSCRIPTION_STATUSES.EXPIRED ||
      subscription.status === SUBSCRIPTION_STATUSES.SUSPENDED ||
      subscription.status === SUBSCRIPTION_STATUSES.CANCELLED
    ) {
      throw new ApiError(
        403,
        `Subscription is ${subscription.status}. Please reactivate or upgrade your subscription plan to access this feature.`,
        {
          code: "SUBSCRIPTION_INACTIVE",
          status: subscription.status,
          plan: subscription.plan,
          upgradeRequired: true,
        }
      );
    }

    const isEnabled = Boolean(subscription.features?.[featureKey]);
    if (!isEnabled) {
      throw new ApiError(
        403,
        `The '${featureKey}' feature is not included in your current plan (${subscription.plan}). Please upgrade to access this feature.`,
        {
          code: "FEATURE_NOT_ENTITLED",
          feature: featureKey,
          plan: subscription.plan,
          upgradeRequired: true,
        }
      );
    }

    return { allowed: true, plan: subscription.plan, feature: featureKey };
  }

  /**
   * Verifies consumption limit against authoritative database records
   */
  static async checkUsageLimit(organizationId, resourceKey) {
    const subscription = await this.getOrganizationSubscription(organizationId);

    if (
      subscription.status === SUBSCRIPTION_STATUSES.EXPIRED ||
      subscription.status === SUBSCRIPTION_STATUSES.SUSPENDED ||
      subscription.status === SUBSCRIPTION_STATUSES.CANCELLED
    ) {
      throw new ApiError(
        403,
        `Subscription is ${subscription.status}. Please reactivate your subscription to perform this action.`,
        {
          code: "SUBSCRIPTION_INACTIVE",
          status: subscription.status,
          plan: subscription.plan,
          upgradeRequired: true,
        }
      );
    }

    const limit = subscription.limits?.[resourceKey];
    if (limit === undefined || limit === -1) {
      // -1 denotes unlimited
      return { allowed: true, currentUsage: 0, limit: -1, plan: subscription.plan };
    }

    // Authoritative database count derivation
    let currentUsage = 0;
    switch (resourceKey) {
      case "candidates":
        currentUsage = await Candidate.countDocuments({ organizationId, status: "ACTIVE" });
        break;
      case "assessments":
        currentUsage = await Assessment.countDocuments({ organizationId });
        break;
      case "activeAssessments":
        currentUsage = await Assessment.countDocuments({ organizationId, status: "PUBLISHED" });
        break;
      case "staffUsers":
        currentUsage = await UserMembership.countDocuments({ organizationId, status: "ACTIVE" });
        break;
      case "interviews":
        currentUsage = await Interview.countDocuments({
          organizationId,
          status: { $in: ["SCHEDULED", "LIVE", "COMPLETED"] },
        });
        break;
      case "monthlyAttempts": {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        currentUsage = await Attempt.countDocuments({
          organizationId,
          createdAt: { $gte: startOfMonth },
        });
        break;
      }
      default:
        currentUsage = subscription.usage?.[`${resourceKey}Used`] || 0;
    }

    if (currentUsage >= limit) {
      throw new ApiError(
        403,
        `You have reached the maximum ${resourceKey} limit (${limit}) for your ${subscription.plan} plan. Please upgrade to continue.`,
        {
          code: "SUBSCRIPTION_LIMIT_REACHED",
          resource: resourceKey,
          currentUsage,
          limit,
          plan: subscription.plan,
          upgradeRequired: true,
        }
      );
    }

    return { allowed: true, currentUsage, limit, plan: subscription.plan };
  }

  /**
   * Retrieves complete usage and entitlement dashboard for an organization
   */
  static async getUsageOverview(organizationId) {
    const subscription = await this.getOrganizationSubscription(organizationId);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      candidatesUsed,
      assessmentsUsed,
      activeAssessmentsUsed,
      staffUsersUsed,
      interviewsUsed,
      attemptsUsed,
    ] = await Promise.all([
      Candidate.countDocuments({ organizationId, status: "ACTIVE" }),
      Assessment.countDocuments({ organizationId }),
      Assessment.countDocuments({ organizationId, status: "PUBLISHED" }),
      UserMembership.countDocuments({ organizationId, status: "ACTIVE" }),
      Interview.countDocuments({
        organizationId,
        status: { $in: ["SCHEDULED", "LIVE", "COMPLETED"] },
      }),
      Attempt.countDocuments({ organizationId, createdAt: { $gte: startOfMonth } }),
    ]);

    return {
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        status: subscription.status,
        startedAt: subscription.startedAt,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      limits: subscription.limits,
      features: subscription.features,
      usage: {
        candidates: { used: candidatesUsed, limit: subscription.limits.candidates },
        assessments: { used: assessmentsUsed, limit: subscription.limits.assessments },
        activeAssessments: { used: activeAssessmentsUsed, limit: subscription.limits.activeAssessments },
        staffUsers: { used: staffUsersUsed, limit: subscription.limits.staffUsers },
        interviews: { used: interviewsUsed, limit: subscription.limits.interviews },
        monthlyAttempts: { used: attemptsUsed, limit: subscription.limits.monthlyAttempts },
      },
    };
  }
}
