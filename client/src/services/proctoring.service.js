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
   * Get single proctoring session details
   */
  async getSessionById(sessionId) {
    const response = await api.get(`/proctoring/sessions/${sessionId}`);
    return response.data || response;
  },

  /**
   * Get events for a specific session
   */
  async getSessionEvents(sessionId, params = {}) {
    const response = await api.get(`/proctoring/sessions/${sessionId}/events`, { params });
    return response.data || response;
  },

  /**
   * Get chronological timeline for a session
   */
  async getSessionTimeline(sessionId) {
    const response = await api.get(`/proctoring/sessions/${sessionId}/timeline`);
    return response.data || response;
  },

  /**
   * Query proctoring events / flags across sessions
   */
  async getEvents(params = {}) {
    const response = await api.get('/proctoring/events', { params });
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
   * Review / dismiss / escalate a proctoring event
   */
  async reviewEvent(eventId, payload = {}) {
    const response = await api.patch(`/proctoring/events/${eventId}/review`, payload);
    return response.data || response;
  },

  /**
   * Send examiner warning or termination action
   */
  async takeAction(sessionId, actionData) {
    const response = await api.post(`/proctoring/sessions/${sessionId}/warning`, actionData);
    return response.data || response;
  },

  /**
   * Send warning message to candidate
   */
  async sendWarning(sessionId, message) {
    const response = await api.post(`/proctoring/sessions/${sessionId}/warning`, { warningMessage: message });
    return response.data || response;
  },

  /**
   * Pause candidate session
   */
  async pauseSession(sessionId, reason = 'Examiner intervention') {
    const response = await api.post(`/proctoring/sessions/${sessionId}/pause`, { reason });
    return response.data || response;
  },

  /**
   * Terminate candidate session
   */
  async terminateSession(sessionId, reason = 'Integrity policy violation') {
    const response = await api.post(`/proctoring/sessions/${sessionId}/terminate`, { reason });
    return response.data || response;
  },

  /**
   * Fetch proctoring evidence and media recordings
   */
  async getSessionEvidence(sessionId) {
    const response = await api.get(`/proctoring/sessions/${sessionId}/evidence`);
    return response.data || response;
  },

  /**
   * Fetch proctoring evidence and media recordings alias
   */
  async getEvidence(sessionId) {
    const response = await api.get(`/proctoring/sessions/${sessionId}/evidence`);
    return response.data || response;
  },
};

export default proctoringService;
