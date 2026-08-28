import api from './api';

export const attemptService = {
  /**
   * Start a new assessment attempt for candidate
   */
  async startAttempt(assessmentId) {
    const response = await api.post('/attempts', { assessmentId });
    return response.data || response;
  },

  /**
   * Periodically auto-save or submit an answer draft
   */
  async saveAnswer(attemptId, payload) {
    const response = await api.post(`/attempts/${attemptId}/answers`, payload);
    return response.data || response;
  },

  /**
   * Finalize and submit the assessment
   */
  async submitAttempt(attemptId, answers = {}) {
    const response = await api.post(`/attempts/${attemptId}/submit`, { answers });
    return response.data || response;
  },

  /**
   * Fetch result breakdown and certified score for an attempt
   */
  async getResult(attemptId) {
    const response = await api.get(`/attempts/${attemptId}/results`);
    return response.data || response;
  },
};

export default attemptService;
