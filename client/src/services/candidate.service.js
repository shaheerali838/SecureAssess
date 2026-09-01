import api from './api';

export const candidateService = {
  /**
   * Fetch candidates for current tenant organization
   */
  async getCandidates(params = {}, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/candidates` : '/candidates';
    const response = await api.get(url, { params });
    return response.data || response;
  },

  /**
   * Fetch candidate details by ID
   */
  async getCandidateById(candidateId, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/candidates/${candidateId}` : `/candidates/${candidateId}`;
    const response = await api.get(url);
    return response.data || response;
  },

  /**
   * Create / Enroll a new candidate
   */
  async createCandidate(data, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/candidates` : '/candidates';
    const response = await api.post(url, data);
    return response.data || response;
  },

  /**
   * Update candidate profile
   */
  async updateCandidate(candidateId, data, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/candidates/${candidateId}` : `/candidates/${candidateId}`;
    const response = await api.patch(url, data);
    return response.data || response;
  },

  /**
   * Suspend candidate
   */
  async suspendCandidate(candidateId, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/candidates/${candidateId}/suspend` : `/candidates/${candidateId}/suspend`;
    const response = await api.post(url);
    return response.data || response;
  },

  /**
   * Activate candidate
   */
  async activateCandidate(candidateId, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/candidates/${candidateId}/activate` : `/candidates/${candidateId}/activate`;
    const response = await api.post(url);
    return response.data || response;
  },

  /**
   * Delete / Deactivate candidate
   */
  async deleteCandidate(candidateId, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/candidates/${candidateId}` : `/candidates/${candidateId}`;
    const response = await api.delete(url);
    return response.data || response;
  },

  /**
   * Bulk import candidates
   */
  async bulkImportCandidates(items, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/candidates/bulk` : '/candidates/bulk';
    const response = await api.post(url, { items });
    return response.data || response;
  },
};

export default candidateService;
