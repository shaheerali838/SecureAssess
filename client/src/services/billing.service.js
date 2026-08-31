import api from './api';

export const billingService = {
  // Get public subscription plans
  getPlans: async () => {
    const response = await api.get('/plans');
    return response.data?.data || response.data || [];
  },

  // Get current organization subscription & entitlements
  getCurrentSubscription: async (organizationId) => {
    const response = await api.get(`/organizations/${organizationId}/subscriptions/current`);
    return response.data?.data || response.data;
  },

  // Get billing overview, cards, and usage summary
  getBillingSummary: async (organizationId) => {
    const response = await api.get(`/organizations/${organizationId}/billing/summary`);
    return response.data?.data || response.data;
  },

  // Create checkout session for subscription upgrade / change
  createCheckoutSession: async (organizationId, { planId, planCode, billingInterval }) => {
    const response = await api.post(`/organizations/${organizationId}/billing/checkout`, {
      planId,
      planCode,
      billingInterval,
    });
    return response.data?.data || response.data;
  },

  // Get paginated billing invoices
  getInvoices: async (organizationId, params = {}) => {
    const response = await api.get(`/organizations/${organizationId}/billing/invoices`, { params });
    return response.data?.data || response.data;
  },

  // Cancel subscription
  cancelSubscription: async (organizationId, reason = '') => {
    const response = await api.post(`/organizations/${organizationId}/subscriptions/cancel`, { reason });
    return response.data?.data || response.data;
  },

  // Reactivate subscription
  reactivateSubscription: async (organizationId) => {
    const response = await api.post(`/organizations/${organizationId}/subscriptions/reactivate`);
    return response.data?.data || response.data;
  },
};

export default billingService;
