import mongoose from "mongoose";
import { BillingCustomer, Invoice, BillingEvent } from "./billing.model.js";
import { getBillingProvider } from "./providers/index.js";
import Plan from "../subscriptions/plan.model.js";
import Subscription from "../subscriptions/subscription.model.js";
import Organization from "../organizations/organization.model.js";
import { SubscriptionService } from "../subscriptions/subscription.service.js";
import { EntitlementService } from "../subscriptions/entitlement.service.js";
import {
  INVOICE_STATUSES,
  WEBHOOK_EVENT_STATUSES,
  BILLING_EVENT_TYPES,
} from "./billing.constants.js";
import { SUBSCRIPTION_STATUSES, DEFAULT_PLANS } from "../subscriptions/subscription.constants.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from "../notifications/notification.constants.js";
import { ApiError } from "../../utils/ApiError.js";

const defaultProvider = getBillingProvider("MOCK");

export class BillingService {
  /**
   * 1. Get or create billing customer identity
   */
  static async getOrCreateCustomer(organizationId, user = null) {
    let customer = await BillingCustomer.findOne({ organizationId });
    if (!customer) {
      const org = await Organization.findById(organizationId);
      if (!org) throw new ApiError(404, "Organization not found");

      const providerCust = await defaultProvider.createCustomer(org, user);
      customer = await BillingCustomer.create({
        organizationId,
        provider: "MOCK",
        providerCustomerId: providerCust.id,
        email: user?.email || org.email || "billing@org.com",
        name: org.name,
      });
    }
    return customer;
  }

  /**
   * 2. Authoritative Checkout Session Creation
   */
  static async createCheckoutSession({
    organizationId,
    planCodeOrId,
    billingInterval = "MONTHLY",
    userId = null,
    successUrl,
    cancelUrl,
  }) {
    // 1. Authoritative Plan Resolution (prevents client price/currency manipulation)
    let plan = null;
    if (mongoose.Types.ObjectId.isValid(planCodeOrId)) {
      plan = await Plan.findById(planCodeOrId);
    }
    if (!plan) {
      plan = await Plan.findOne({ code: String(planCodeOrId).toUpperCase() });
    }
    if (!plan && DEFAULT_PLANS[String(planCodeOrId).toUpperCase()]) {
      plan = await Plan.create(DEFAULT_PLANS[String(planCodeOrId).toUpperCase()]);
    }
    if (!plan) {
      throw new ApiError(400, `Invalid subscription plan: '${planCodeOrId}'`);
    }

    const customer = await this.getOrCreateCustomer(organizationId);

    const checkoutSession = await defaultProvider.createCheckoutSession({
      organizationId,
      customerId: customer.providerCustomerId,
      planId: plan._id,
      planCode: plan.code,
      price: plan.price,
      currency: plan.currency,
      billingInterval,
      successUrl,
      cancelUrl,
    });

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "CREATE",
      resource: "BILLING",
      description: `Created checkout session for plan '${plan.name}' (${plan.code}) at ${plan.price} ${plan.currency}`,
      metadata: {
        sessionId: checkoutSession.sessionId,
        planCode: plan.code,
        price: plan.price,
        currency: plan.currency,
      },
    }).catch(() => {});

    return {
      sessionId: checkoutSession.sessionId,
      url: checkoutSession.url,
      plan: {
        id: plan._id,
        name: plan.name,
        code: plan.code,
        price: plan.price,
        currency: plan.currency,
        billingInterval,
      },
    };
  }

  /**
   * 3. Customer Billing Portal Session
   */
  static async createBillingPortalSession(organizationId, returnUrl) {
    const customer = await this.getOrCreateCustomer(organizationId);
    return defaultProvider.createBillingPortalSession(customer.providerCustomerId, returnUrl);
  }

  /**
   * 4. Billing Overview & Summary
   */
  static async getBillingSummary(organizationId) {
    const subscription = await EntitlementService.getOrganizationSubscription(organizationId);
    const customer = await BillingCustomer.findOne({ organizationId });
    const latestInvoices = await Invoice.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      subscription: {
        id: subscription._id,
        planCode: subscription.planCode || subscription.plan,
        status: subscription.status,
        price: subscription.price,
        currency: subscription.currency,
        billingInterval: subscription.billingInterval,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      customer: customer ? { id: customer._id, providerCustomerId: customer.providerCustomerId } : null,
      recentInvoices: latestInvoices,
    };
  }

  /**
   * 5. Paginated Invoices List
   */
  static async getInvoices(organizationId, query = {}) {
    const filter = { organizationId: new mongoose.Types.ObjectId(organizationId) };
    if (query.status) filter.status = query.status;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(filter),
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
   * 6. Cancel Subscription
   */
  static async cancelSubscription(organizationId, atPeriodEnd = true, userId = null) {
    return SubscriptionService.cancelSubscription(organizationId, atPeriodEnd, userId);
  }

  /**
   * 7. Reactivate Subscription
   */
  static async reactivateSubscription(organizationId, userId = null) {
    return SubscriptionService.reactivateSubscription(organizationId, userId);
  }

  /**
   * 8. Process Verified Webhook Events with Idempotency & Financial Precision
   */
  static async processWebhook(rawPayload, signature, providerName = "MOCK", secret = "mock_webhook_secret_key_123") {
    const payloadStr = typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload);
    const parsedPayload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;

    const provider = getBillingProvider(providerName);
    const isValidSignature = provider.verifyWebhookSignature(payloadStr, signature, secret);

    if (!isValidSignature) {
      throw new ApiError(400, "Invalid webhook signature");
    }

    const eventId = parsedPayload.id || parsedPayload.eventId;
    const eventType = parsedPayload.type || parsedPayload.eventType;
    const eventData = parsedPayload.data?.object || parsedPayload.data || {};

    if (!eventId || !eventType) {
      throw new ApiError(400, "Invalid webhook event payload");
    }

    // Idempotency: Check if already processed
    const existingEvent = await BillingEvent.findOne({ provider: providerName, eventId });
    if (existingEvent && existingEvent.status === WEBHOOK_EVENT_STATUSES.PROCESSED) {
      return { received: true, processed: true, idempotencyDeduplicated: true, eventId };
    }

    // Record or update BillingEvent
    let billingEvent = existingEvent;
    if (!billingEvent) {
      billingEvent = await BillingEvent.create({
        provider: providerName,
        eventId,
        eventType,
        status: WEBHOOK_EVENT_STATUSES.PROCESSING,
        data: eventData,
      });
    }

    const { organizationId, plan, status, amount = 199, currency = "USD", invoiceId = `inv_${eventId}` } = eventData;

    if (!organizationId) {
      billingEvent.status = WEBHOOK_EVENT_STATUSES.IGNORED;
      billingEvent.errorMessage = "Missing organizationId";
      await billingEvent.save();
      return { received: true, processed: false, reason: "No organizationId" };
    }

    try {
      const subscription = await EntitlementService.getOrganizationSubscription(organizationId);

      // Handle Event Types
      if (
        eventType === "invoice.payment_succeeded" ||
        eventType === "checkout.session.completed" ||
        eventType === BILLING_EVENT_TYPES.PAYMENT_SUCCEEDED ||
        eventType === BILLING_EVENT_TYPES.CHECKOUT_COMPLETED
      ) {
        if (plan) {
          let targetPlan = await Plan.findOne({ code: String(plan).toUpperCase() });
          if (!targetPlan && DEFAULT_PLANS[String(plan).toUpperCase()]) {
            targetPlan = await Plan.create(DEFAULT_PLANS[String(plan).toUpperCase()]);
          }
          if (targetPlan) {
            subscription.planId = targetPlan._id;
            subscription.planCode = targetPlan.code;
            subscription.plan = targetPlan.code;
            subscription.limits = targetPlan.limits;
            subscription.features = targetPlan.features;
            subscription.price = targetPlan.price;
            subscription.currency = targetPlan.currency;
          }
        }
        subscription.status = SUBSCRIPTION_STATUSES.ACTIVE;
        subscription.currentPeriodStart = new Date();
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await subscription.save();

        // Financial precision: Minor integer units (cents)
        const safeAmountInCents = Math.round(Number(amount) * 100);

        await Invoice.findOneAndUpdate(
          { providerInvoiceId: invoiceId },
          {
            $set: {
              organizationId,
              subscriptionId: subscription._id,
              provider: providerName,
              providerInvoiceId: invoiceId,
              amount: Number(amount),
              amountInCents: safeAmountInCents,
              currency: String(currency).toUpperCase(),
              status: INVOICE_STATUSES.PAID,
              paidAt: new Date(),
              billingPeriodStart: subscription.currentPeriodStart,
              billingPeriodEnd: subscription.currentPeriodEnd,
            },
          },
          { upsert: true, returnDocument: "after" }
        );

        AuditLogService.createAuditLog({
          organizationId,
          action: "UPDATE",
          resource: "BILLING",
          description: `Payment succeeded for plan '${subscription.planCode}' (${amount} ${currency})`,
          metadata: { eventId, invoiceId, amount, currency },
        }).catch(() => {});

        NotificationService.createNotification({
          organizationId,
          type: NOTIFICATION_TYPES.SUBSCRIPTION_ACTIVATED || "SUBSCRIPTION_ACTIVATED",
          title: "Payment Confirmation & Subscription Activated",
          message: `Your payment of ${amount} ${currency} was successful. Plan '${subscription.planCode}' is active.`,
          priority: NOTIFICATION_PRIORITIES.NORMAL,
        }).catch(() => {});
      } else if (
        eventType === "invoice.payment_failed" ||
        eventType === BILLING_EVENT_TYPES.PAYMENT_FAILED
      ) {
        subscription.status = SUBSCRIPTION_STATUSES.PAST_DUE;
        await subscription.save();

        const safeAmountInCents = Math.round(Number(amount) * 100);
        await Invoice.findOneAndUpdate(
          { providerInvoiceId: invoiceId },
          {
            $set: {
              organizationId,
              subscriptionId: subscription._id,
              provider: providerName,
              providerInvoiceId: invoiceId,
              amount: Number(amount),
              amountInCents: safeAmountInCents,
              currency: String(currency).toUpperCase(),
              status: INVOICE_STATUSES.FAILED,
            },
          },
          { upsert: true, returnDocument: "after" }
        );

        AuditLogService.createAuditLog({
          organizationId,
          action: "WARNING",
          resource: "BILLING",
          description: `Payment failed for invoice ${invoiceId}. Subscription marked PAST_DUE.`,
          metadata: { eventId, invoiceId },
        }).catch(() => {});

        NotificationService.createNotification({
          organizationId,
          type: NOTIFICATION_TYPES.SECURITY_ALERT,
          title: "Billing Alert: Payment Failed",
          message: `Payment failed for invoice ${invoiceId}. Please update your payment method.`,
          priority: NOTIFICATION_PRIORITIES.URGENT,
        }).catch(() => {});
      } else if (
        eventType === "customer.subscription.deleted" ||
        eventType === BILLING_EVENT_TYPES.SUBSCRIPTION_CANCELLED
      ) {
        subscription.status = SUBSCRIPTION_STATUSES.CANCELLED;
        subscription.cancelledAt = new Date();
        await subscription.save();

        AuditLogService.createAuditLog({
          organizationId,
          action: "CANCEL",
          resource: "BILLING",
          description: `Subscription cancelled via provider event ${eventId}`,
        }).catch(() => {});
      }

      billingEvent.status = WEBHOOK_EVENT_STATUSES.PROCESSED;
      billingEvent.processedAt = new Date();
      await billingEvent.save();

      return { received: true, processed: true, eventId };
    } catch (err) {
      billingEvent.status = WEBHOOK_EVENT_STATUSES.FAILED;
      billingEvent.errorMessage = err.message;
      await billingEvent.save();
      throw err;
    }
  }
}
