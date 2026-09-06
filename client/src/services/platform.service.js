import api from './api';

export const platformService = {
  /**
   * Get platform-wide overview stats
   */
  async getPlatformStats() {
    const response = await api.get('/platform/stats');
    return response.data || response;
  },

  /**
   * 1. Get Security Center threat intelligence & WAF metrics
   */
  async getSecurityIntelligence() {
    const response = await api.get('/platform/security');
    return response.data || response;
  },

  /**
   * 2. Get Global Platform Audit Logs
   */
  async getAuditLogs(params = {}) {
    const response = await api.get('/platform/audit-logs', { params });
    return response.data || response;
  },

  /**
   * 3. Get Platform Access & Administrator Directory
   */
  async getPlatformAccess() {
    const response = await api.get('/platform/access');
    return response.data || response;
  },

  /**
   * 4. Get System Compute & Telemetry Monitoring
   */
  async getMonitoringTelemetry() {
    const response = await api.get('/platform/monitoring');
    return response.data || response;
  },

  /**
   * 5. Get Microservice Health Status Matrix
   */
  async getServiceHealth() {
    const response = await api.get('/platform/services');
    return response.data || response;
  },

  /**
   * 6. Get Subscription Plans & Entitlements Catalog
   */
  async getSubscriptionPlans() {
    const response = await api.get('/platform/plans');
    return response.data || response;
  },

  /**
   * 7. Get Platform Financials & Invoice Ledger
   */
  async getBillingOverview() {
    const response = await api.get('/platform/billing');
    return response.data || response;
  },

  /**
   * 8. Get Platform Global Configuration
   */
  async getPlatformSettings() {
    const response = await api.get('/platform/settings');
    return response.data || response;
  },

  /**
   * Update Platform Global Configuration
   */
  async updatePlatformSettings(data) {
    const response = await api.put('/platform/settings', data);
    return response.data || response;
  },

  /**
   * List all platform organizations
   */
  async getOrganizations(params = {}) {
    const response = await api.get('/organizations', { params });
    return response.data || response;
  },

  /**
   * Provision new organization tenant
   */
  async createOrganization(data) {
    const response = await api.post('/organizations', data);
    return response.data || response;
  },

  /**
   * Suspend tenant organization
   */
  async suspendOrganization(organizationId) {
    const response = await api.post(`/organizations/${organizationId}/suspend`);
    return response.data || response;
  },

  /**
   * Activate tenant organization
   */
  async activateOrganization(organizationId) {
    const response = await api.post(`/organizations/${organizationId}/activate`);
    return response.data || response;
  },
};

export default platformService;
