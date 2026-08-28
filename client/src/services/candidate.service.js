import api from './api';

export const candidateService = {
  /**
   * Fetch candidates / examinees for current tenant
   */
  async getCandidates(params = {}) {
    const response = await api.get('/users', { params: { role: 'CANDIDATE', ...params } });
    return response.data || response;
  },

  /**
   * Fetch candidate details by ID
   */
  async getCandidateById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data || response;
  },

  /**
   * Create / Enroll a candidate
   */
  async createCandidate(data) {
    const response = await api.post('/users', { ...data, role: 'CANDIDATE' });
    return response.data || response;
  },
};

export default candidateService;
