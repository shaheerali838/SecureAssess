import crypto from "crypto";

export class BillingProvider {
  async createCustomer(organization, user) {
    throw new Error("createCustomer() not implemented");
  }

  async createSubscription(customerId, plan, paymentMethodId) {
    throw new Error("createSubscription() not implemented");
  }

  async cancelSubscription(subscriptionId, atPeriodEnd = true) {
    throw new Error("cancelSubscription() not implemented");
  }

  async changePlan(subscriptionId, newPlan) {
    throw new Error("changePlan() not implemented");
  }

  async getSubscription(subscriptionId) {
    throw new Error("getSubscription() not implemented");
  }

  verifyWebhookSignature(payload, signature, secret) {
    throw new Error("verifyWebhookSignature() not implemented");
  }
}

export class MockBillingProvider extends BillingProvider {
  async createCustomer(organization, user) {
    const customerId = `cus_mock_${crypto.randomBytes(8).toString("hex")}`;
    return {
      id: customerId,
      email: user?.email || "billing@org.com",
      name: organization?.name || "Organization",
    };
  }

  async createSubscription(customerId, plan, paymentMethodId = null) {
    const subscriptionId = `sub_mock_${crypto.randomBytes(8).toString("hex")}`;
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return {
      id: subscriptionId,
      customerId,
      plan,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
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

  async changePlan(subscriptionId, newPlan) {
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
    };
  }

  verifyWebhookSignature(payload, signature, secret) {
    if (!signature || !secret) {
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
