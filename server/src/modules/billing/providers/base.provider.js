export class BaseBillingProvider {
  async createCustomer(organization, user) {
    throw new Error("createCustomer() not implemented");
  }

  async createCheckoutSession(params) {
    throw new Error("createCheckoutSession() not implemented");
  }

  async createBillingPortalSession(customerId, returnUrl) {
    throw new Error("createBillingPortalSession() not implemented");
  }

  async cancelSubscription(subscriptionId, atPeriodEnd = true) {
    throw new Error("cancelSubscription() not implemented");
  }

  async changeSubscription(subscriptionId, newPlan) {
    throw new Error("changeSubscription() not implemented");
  }

  async getSubscription(subscriptionId) {
    throw new Error("getSubscription() not implemented");
  }

  verifyWebhookSignature(payload, signature, secret) {
    throw new Error("verifyWebhookSignature() not implemented");
  }
}
