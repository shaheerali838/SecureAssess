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

  /**
   * Fetch all proctoring & telemetry events
   */
  async getEvents(params = {}) {
    const response = await api.get('/proctoring/events', { params });
    return response.data || response;
  },

  /**
   * Fetch events for a single proctoring session
   */
  async getSessionEvents(sessionId, params = {}) {
    const response = await api.get(`/proctoring/sessions/${sessionId}/events`, { params });
    return response.data || response;
  },

  /**
   * Fetch timeline telemetry for a session
   */
  async getSessionTimeline(sessionId) {
    const response = await api.get(`/proctoring/sessions/${sessionId}/timeline`);
    return response.data || response;
  },

  /**
   * Send warning to candidate
   */
  async sendWarning(sessionId, data) {
    const response = await api.post(`/proctoring/sessions/${sessionId}/warning`, data);
    return response.data || response;
  },

  /**
   * Pause candidate session
   */
  async pauseSession(sessionId, data) {
    const response = await api.post(`/proctoring/sessions/${sessionId}/pause`, data);
    return response.data || response;
  },

  /**
   * Terminate candidate session for integrity violation
   */
  async terminateSession(sessionId, data) {
    const response = await api.post(`/proctoring/sessions/${sessionId}/terminate`, data);
    return response.data || response;
  },

  /**
   * Submit integrity review decision
   */
  async setIntegrityDecision(sessionId, data) {
    const response = await api.post(`/proctoring/sessions/${sessionId}/decision`, data);
    return response.data || response;
  },
};

export default proctoringService;
