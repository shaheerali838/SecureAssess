import api from './api';

export const proctoringService = {
  /**
   * List proctoring sessions for organization
   */
  async getSessions(params = {}) {
    const response = await api.get('/proctoring/sessions', { params });
    return response.data || response;
  },

  /**
   * Get single proctoring session
   */
  async getSessionById(sessionId) {
    const response = await api.get(`/proctoring/sessions/${sessionId}`);
    return response.data || response;
  },

  /**
   * Log proctoring telemetry / violation event
   */
  async logEvent(sessionId, eventData) {
    const response = await api.post(`/proctoring/sessions/${sessionId}/events`, eventData);
    return response.data || response;
  },

  /**
   * Send examiner warning or termination action
   */
  async takeAction(sessionId, actionData) {
    const response = await api.post(`/proctoring/sessions/${sessionId}/actions`, actionData);
    return response.data || response;
  },

  /**
   * Fetch proctoring evidence and media recordings
   */
  async getEvidence(sessionId) {
    const response = await api.get(`/proctoring/sessions/${sessionId}/evidence`);
    return response.data || response;
  },
};

export default proctoringService;
