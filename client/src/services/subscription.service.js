import api from './api';

export const subscriptionService = {
  /**
   * Get current organization subscription & entitlement limits
   */
  async getCurrentSubscription(organizationId) {
    const primaryUrl = organizationId
      ? `/organizations/${organizationId}/subscriptions/current`
      : '/subscriptions/current';
    try {
      const response = await api.get(primaryUrl);
      return response.data || response;
    } catch (err) {
      if (organizationId) {
        const fallback = await api.get('/subscriptions/current');
        return fallback.data || fallback;
      }
      throw err;
    }
  },

  /**
   * Get dynamic usage and quota metering for current tenant
   */
  async getUsageAndEntitlements(organizationId) {
    const primaryUrl = organizationId
      ? `/organizations/${organizationId}/subscriptions/usage`
      : '/subscriptions/usage';
    try {
      const response = await api.get(primaryUrl);
      return response.data || response;
    } catch (err) {
      if (organizationId) {
        const fallback = await api.get('/subscriptions/usage');
        return fallback.data || fallback;
      }
      throw err;
    }
  },

  /**
   * Get all active platform subscription tiers/plans
   */
  async getPlans() {
    const response = await api.get('/plans');
    return response.data || response;
  },

  /**
   * Upgrade or change subscription plan
   */
  async changePlan(plan, organizationId) {
    const primaryUrl = organizationId
      ? `/organizations/${organizationId}/subscriptions/change-plan`
      : '/subscriptions/change-plan';
    try {
      const response = await api.post(primaryUrl, { plan });
      return response.data || response;
    } catch (err) {
      const altUrl = organizationId
        ? `/organizations/${organizationId}/subscriptions/upgrade`
        : '/subscriptions/upgrade';
      try {
        const response = await api.post(altUrl, { plan });
        return response.data || response;
      } catch (err2) {
        // Final fallback attempt using generic root route if scoped failed
        if (organizationId) {
          const fallback = await api.post('/subscriptions/change-plan', { plan });
          return fallback.data || fallback;
        }
        throw err2;
      }
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(reason, organizationId) {
    const primaryUrl = organizationId
      ? `/organizations/${organizationId}/subscriptions/cancel`
      : '/subscriptions/cancel';
    try {
      const response = await api.post(primaryUrl, { reason });
      return response.data || response;
    } catch (err) {
      if (organizationId) {
        const fallback = await api.post('/subscriptions/cancel', { reason });
        return fallback.data || fallback;
      }
      throw err;
    }
  },

  /**
   * Get live invoices for tenant
   */
  async getInvoices(params = {}, organizationId) {
    const primaryUrl = organizationId
      ? `/organizations/${organizationId}/billing/invoices`
      : '/billing/invoices';
    try {
      const response = await api.get(primaryUrl, { params });
      return response.data || response;
    } catch (err) {
      if (organizationId) {
        const fallback = await api.get('/billing/invoices', { params });
        return fallback.data || fallback;
      }
      throw err;
    }
  },

  /**
   * Get live billing overview & summary
   */
  async getBillingSummary(organizationId) {
    const primaryUrl = organizationId
      ? `/organizations/${organizationId}/billing/summary`
      : '/billing/summary';
    try {
      const response = await api.get(primaryUrl);
      return response.data || response;
    } catch (err) {
      if (organizationId) {
        const fallback = await api.get('/billing/summary');
        return fallback.data || fallback;
      }
      throw err;
    }
  },
};

export default subscriptionService;
