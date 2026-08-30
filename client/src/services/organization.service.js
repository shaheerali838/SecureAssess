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
   * Update organization details & settings
   */
  updateOrganization: async (organizationId, updateData) => {
    const response = await api.patch(`/organizations/${organizationId}`, updateData);
    return response.data || response;
  },

  /**
   * Switch organization context
   */
  switchOrganization: async (organizationId) => {
    const response = await api.post(`/organizations/${organizationId}/switch`);
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

  /**
   * Suspend organization
   */
  suspendOrganization: async (organizationId) => {
    const response = await api.post(`/organizations/${organizationId}/suspend`);
    return response.data || response;
  },

  /**
   * Activate organization
   */
  activateOrganization: async (organizationId) => {
    const response = await api.post(`/organizations/${organizationId}/activate`);
    return response.data || response;
  },

  /**
   * List staff members in organization
   */
  listMembers: async (organizationId, params = {}) => {
    const response = await api.get(`/organizations/${organizationId}/members`, { params });
    return response.data || response;
  },

  /**
   * Invite staff member to organization
   */
  inviteMember: async (organizationId, inviteData) => {
    const response = await api.post(`/organizations/${organizationId}/members/invite`, inviteData);
    return response.data || response;
  },

  /**
   * Update staff member role or status
   */
  updateMember: async (organizationId, membershipId, updateData) => {
    const response = await api.patch(
      `/organizations/${organizationId}/members/${membershipId}/role`,
      updateData
    );
    return response.data || response;
  },

  /**
   * Remove member from organization
   */
  removeMember: async (organizationId, membershipId) => {
    const response = await api.delete(`/organizations/${organizationId}/members/${membershipId}`);
    return response.data || response;
  },
};

export default organizationService;
