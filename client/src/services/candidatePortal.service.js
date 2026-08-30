import api from './api';

export const candidatePortalService = {
  /**
   * Fetch candidate profile
   */
  async getProfile() {
    const response = await api.get('/candidate-portal/portal/profile');
    return response.data || response;
  },

  /**
   * Update candidate profile
   */
  async updateProfile(data) {
    const response = await api.patch('/candidate-portal/portal/profile', data);
    return response.data || response;
  },

  /**
   * Fetch candidate assigned assessments
   */
  async getAssignments(params = {}) {
    const response = await api.get('/candidate-portal/portal/assignments', { params });
    return response.data || response;
  },

  /**
   * Fetch candidate exam attempts
   */
  async getAttempts(params = {}) {
    const response = await api.get('/candidate-portal/portal/attempts', { params });
    return response.data || response;
  },

  /**
   * Fetch candidate published results
   */
  async getResults(params = {}) {
    const response = await api.get('/candidate-portal/portal/results', { params });
    return response.data || response;
  },

  /**
   * Fetch candidate issued certificates
   */
  async getCertificates(params = {}) {
    const response = await api.get('/candidate-portal/portal/certificates', { params });
    return response.data || response;
  },

  /**
   * Fetch candidate scheduled live interviews
   */
  async getInterviews(params = {}) {
    const response = await api.get('/candidate-portal/portal/interviews', { params });
    return response.data || response;
  },
};

export default candidatePortalService;
