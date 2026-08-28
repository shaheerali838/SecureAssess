import api from './api';

export const organizationService = {
  /**
   * List organizations (Platform gets all, tenant member gets assigned orgs)
   */
  getOrganizations: async (params = {}) => {
    const response = await api.get('/organizations', { params });
    return response.data || response;
  },

  /**
   * Alias for backwards compatibility
   */
  getMyOrganizations: async () => {
    const response = await api.get('/organizations');
    return response.data || response;
  },

  /**
   * Get organization details by ID
   */
  getOrganizationById: async (organizationId) => {
    const response = await api.get(`/organizations/${organizationId}`);
    return response.data || response;
  },

  /**
   * Platform-level: List all tenant organizations
   */
  listPlatformOrganizations: async (params = {}) => {
    const response = await api.get('/organizations', { params });
    return response.data || response;
  },

  /**
   * Platform-level: Create organization tenant
   */
  createOrganization: async (orgData) => {
    const response = await api.post('/organizations', orgData);
    return response.data || response;
  },

  /**
   * Platform-level: Update organization status
   */
  updateOrganizationStatus: async (organizationId, status) => {
    const response = await api.patch(`/organizations/${organizationId}/status`, { status });
    return response.data || response;
  },
};

export default organizationService;
