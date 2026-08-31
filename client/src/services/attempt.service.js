import api from './api';

export const attemptService = {
  /**
   * Fetch attempts list for current organization
   */
  async getAttempts(params = {}) {
    const response = await api.get('/attempts', { params });
    return response.data || response;
  },

  /**
   * Fetch a single attempt by ID
   */
  async getAttemptById(attemptId) {
    const response = await api.get(`/attempts/${attemptId}`);
    return response.data || response;
  },

  /**
   * Start a new assessment attempt for candidate
   */
  async startAttempt(assignmentIdOrPayload, orgId) {
    const payload = typeof assignmentIdOrPayload === 'string'
      ? { assignmentId: assignmentIdOrPayload, organizationId: orgId }
      : assignmentIdOrPayload;
    const response = await api.post('/attempts/start', payload);
    return response.data || response;
  },

  /**
   * Fetch all questions belonging to an active attempt
   */
  async getAttemptQuestions(attemptId) {
    const response = await api.get(`/attempts/${attemptId}/questions`);
    return response.data || response;
  },

  /**
   * Periodically auto-save or submit an answer draft
   */
  async saveAnswer(attemptId, questionIdOrPayload, answerVal) {
    let questionId = questionIdOrPayload;
    let payload = answerVal;

    if (typeof questionIdOrPayload === 'object' && questionIdOrPayload !== null) {
      questionId = questionIdOrPayload.questionId || questionIdOrPayload.attemptQuestionId;
      payload = questionIdOrPayload;
    }

    if (questionId) {
      const response = await api.post(`/attempts/${attemptId}/questions/${questionId}/answer`, payload);
      return response.data || response;
    }

    const response = await api.post(`/attempts/${attemptId}/answers`, payload);
    return response.data || response;
  },

  /**
   * Flag or unflag a question for later candidate review
   */
  async flagQuestion(attemptId, questionId, flagged = true) {
    const response = await api.patch(`/attempts/${attemptId}/questions/${questionId}/flag`, { flagged });
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
   * Send heartbeat to keep attempt alive
   */
  async sendHeartbeat(attemptId) {
    const response = await api.post(`/attempts/${attemptId}/heartbeat`);
    return response.data || response;
  },

  /**
   * Fetch result breakdown and certified score for an attempt
   */
  async getResult(attemptId) {
    const response = await api.get(`/evaluations/attempts/${attemptId}/result`);
    return response.data || response;
  },
};

export default attemptService;
