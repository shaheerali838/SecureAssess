import api from './api';

export const subscriptionService = {
  /**
   * Get current organization subscription & entitlement limits
   */
  async getCurrentSubscription() {
    const response = await api.get('/subscriptions/current');
    return response.data || response;
  },

  /**
   * Upgrade or change subscription plan
   */
  async changePlan(plan) {
    const response = await api.post('/subscriptions/upgrade', { plan });
    return response.data || response;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(reason) {
    const response = await api.post('/subscriptions/cancel', { reason });
    return response.data || response;
  },
};

export default subscriptionService;
