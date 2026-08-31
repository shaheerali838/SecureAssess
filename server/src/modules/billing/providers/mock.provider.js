import crypto from "crypto";
import { BaseBillingProvider } from "./base.provider.js";

export class MockBillingProvider extends BaseBillingProvider {
  async createCustomer(organization, user) {
    const customerId = `cus_mock_${crypto.randomBytes(8).toString("hex")}`;
    return {
      id: customerId,
      email: user?.email || "billing@org.com",
      name: organization?.name || "Organization",
    };
  }

  async createCheckoutSession({ organizationId, planId, planCode, price, currency, successUrl, cancelUrl }) {
    const sessionId = `cs_mock_${crypto.randomBytes(12).toString("hex")}`;
    return {
      sessionId,
      url: `${successUrl || "https://secureassess.app/billing/success"}?session_id=${sessionId}`,
      status: "OPEN",
    };
  }

  async createBillingPortalSession(customerId, returnUrl) {
    return {
      url: `${returnUrl || "https://secureassess.app/billing"}?portal_session=active`,
    };
  }

  async cancelSubscription(subscriptionId, atPeriodEnd = true) {
    return {
      id: subscriptionId,
      status: atPeriodEnd ? "ACTIVE" : "CANCELLED",
      cancelAtPeriodEnd: atPeriodEnd,
      cancelledAt: new Date(),
    };
  }

  async changeSubscription(subscriptionId, newPlan) {
    return {
      id: subscriptionId,
      plan: newPlan,
      status: "ACTIVE",
    };
  }

  async getSubscription(subscriptionId) {
    return {
      id: subscriptionId,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  verifyWebhookSignature(payload, signature, secret) {
    if (!signature) {
      return false;
    }
    if (signature === "mock_sig_valid" || signature === "test_signature") {
      return true;
    }
    if (!secret) {
      return false;
    }
    const computed = crypto
      .createHmac("sha256", secret)
      .update(typeof payload === "string" ? payload : JSON.stringify(payload))
      .digest("hex");
    const sigBuf = Buffer.from(signature);
    const compBuf = Buffer.from(computed);
    if (sigBuf.length !== compBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, compBuf);
  }
}
