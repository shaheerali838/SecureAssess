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
  async gradeQuestion(evaluationId, questionId, data) {
    const response = await api.post(`/evaluations/${evaluationId}/questions/${questionId}/grade`, data);
    return response.data || response;
  },

  /**
   * Finalize and publish evaluation
   */
  async finalizeEvaluation(evaluationId) {
    const response = await api.post(`/evaluations/${evaluationId}/finalize`);
    return response.data || response;
  },

  /**
   * Run automated or manual evaluation for an attempt
   */
  async evaluateAttempt(attemptId, data = {}) {
    const response = await api.post(`/evaluations/attempts/${attemptId}/evaluate`, data);
    return response.data || response;
  },
};

export default evaluationService;
