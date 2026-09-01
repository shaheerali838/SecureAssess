import api from './api';

export const proctoringService = {
  /**
   * List proctoring sessions for organization
   */
  async getSessions(params = {}, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions` : '/proctoring/sessions';
    const response = await api.get(url, { params });
    return response.data || response;
  },

  /**
   * Get single proctoring session details
   */
  async getSessionById(sessionId, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions/${sessionId}` : `/proctoring/sessions/${sessionId}`;
    const response = await api.get(url);
    return response.data || response;
  },

  /**
   * Get events for a specific session
   */
  async getSessionEvents(sessionId, params = {}, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions/${sessionId}/events` : `/proctoring/sessions/${sessionId}/events`;
    const response = await api.get(url, { params });
    return response.data || response;
  },

  /**
   * Get chronological timeline for a session
   */
  async getSessionTimeline(sessionId, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions/${sessionId}/timeline` : `/proctoring/sessions/${sessionId}/timeline`;
    const response = await api.get(url);
    return response.data || response;
  },

  /**
   * Query proctoring events / flags across sessions
   */
  async getEvents(params = {}, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/events` : '/proctoring/events';
    const response = await api.get(url, { params });
    return response.data || response;
  },

  /**
   * Log proctoring telemetry / violation event
   */
  async logEvent(sessionId, eventData, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions/${sessionId}/events` : `/proctoring/sessions/${sessionId}/events`;
    const response = await api.post(url, eventData);
    return response.data || response;
  },

  /**
   * Review / dismiss / escalate a proctoring event
   */
  async reviewEvent(eventId, payload = {}, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/events/${eventId}/review` : `/proctoring/events/${eventId}/review`;
    const response = await api.patch(url, payload);
    return response.data || response;
  },

  /**
   * Send warning message to candidate
   */
  async sendWarning(sessionId, message, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions/${sessionId}/warning` : `/proctoring/sessions/${sessionId}/warning`;
    const response = await api.post(url, { warningMessage: message });
    return response.data || response;
  },

  /**
   * Pause candidate session
   */
  async pauseSession(sessionId, reason = 'Examiner intervention', orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions/${sessionId}/pause` : `/proctoring/sessions/${sessionId}/pause`;
    const response = await api.post(url, { reason });
    return response.data || response;
  },

  /**
   * Terminate candidate session
   */
  async terminateSession(sessionId, reason = 'Integrity policy violation', orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions/${sessionId}/terminate` : `/proctoring/sessions/${sessionId}/terminate`;
    const response = await api.post(url, { reason });
    return response.data || response;
  },

  /**
   * Fetch proctoring evidence and media recordings
   */
  async getSessionEvidence(sessionId, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/proctoring/sessions/${sessionId}/evidence` : `/proctoring/sessions/${sessionId}/evidence`;
    const response = await api.get(url);
    return response.data || response;
  },

  /**
   * Fetch proctoring evidence alias
   */
  async getEvidence(sessionId, orgId = null) {
    return this.getSessionEvidence(sessionId, orgId);
  },
};

export default proctoringService;
