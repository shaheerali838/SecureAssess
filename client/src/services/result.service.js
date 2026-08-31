import api from './api';

export const resultService = {
  /**
   * List results with filtering (e.g. by candidateId, assessmentId)
   */
  async getResults(params = {}) {
    const response = await api.get('/results', { params });
    return response.data || response;
  },

  /**
   * Get single result details by ID
   */
  async getResultById(resultId) {
    const response = await api.get(`/results/${resultId}`);
    return response.data || response;
  },

  /**
   * Get authenticated candidate's own results
   */
  async getMyResults(params = {}) {
    const response = await api.get('/results/my', { params });
    return response.data || response;
  },

  /**
   * Generate result from evaluation
   */
  async generateResult(evaluationId) {
    const response = await api.post(`/results/evaluations/${evaluationId}/generate`);
    return response.data || response;
  },

  /**
   * Publish result to candidate
   */
  async publishResult(resultId) {
    const response = await api.post(`/results/${resultId}/publish`);
    return response.data || response;
  },

  /**
   * Unpublish result
   */
  async unpublishResult(resultId) {
    const response = await api.post(`/results/${resultId}/unpublish`);
    return response.data || response;
  },
};

export default resultService;
