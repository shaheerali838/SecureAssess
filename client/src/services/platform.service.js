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
