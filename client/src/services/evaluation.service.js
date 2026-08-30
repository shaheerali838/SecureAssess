import api from './api';

export const evaluationService = {
  /**
   * List evaluations for organization
   */
  async getEvaluations(params = {}) {
    const response = await api.get('/evaluations', { params });
    return response.data || response;
  },

  /**
   * Get single evaluation by ID
   */
  async getEvaluationById(evaluationId) {
    const response = await api.get(`/evaluations/${evaluationId}`);
    return response.data || response;
  },

  /**
   * Submit manual grade for a question
   */
  async gradeQuestion(evaluationId, data) {
    const response = await api.post(`/evaluations/${evaluationId}/grade`, data);
    return response.data || response;
  },

  /**
   * Finalize and publish evaluation
   */
  async finalizeEvaluation(evaluationId) {
    const response = await api.post(`/evaluations/${evaluationId}/finalize`);
    return response.data || response;
  },
};

export default evaluationService;
