import api from './api';

export const candidateService = {
  /**
   * Fetch candidates for current tenant organization
   */
  async getCandidates(params = {}) {
    const response = await api.get('/candidates', { params });
    return response.data || response;
  },

  /**
   * Fetch candidate details by ID
   */
  async getCandidateById(candidateId) {
    const response = await api.get(`/candidates/${candidateId}`);
    return response.data || response;
  },

  /**
   * Create / Enroll a new candidate
   */
  async createCandidate(data) {
    const response = await api.post('/candidates', data);
    return response.data || response;
  },

  /**
   * Update candidate profile
   */
  async updateCandidate(candidateId, data) {
    const response = await api.patch(`/candidates/${candidateId}`, data);
    return response.data || response;
  },

  /**
   * Suspend candidate
   */
  async suspendCandidate(candidateId) {
    const response = await api.post(`/candidates/${candidateId}/suspend`);
    return response.data || response;
  },

  /**
   * Activate candidate
   */
  async activateCandidate(candidateId) {
    const response = await api.post(`/candidates/${candidateId}/activate`);
    return response.data || response;
  },

  /**
   * Delete / Deactivate candidate
   */
  async deleteCandidate(candidateId) {
    const response = await api.delete(`/candidates/${candidateId}`);
    return response.data || response;
  },
};

export default candidateService;
