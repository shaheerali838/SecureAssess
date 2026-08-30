import api from "../../../services/api";

export const proctoringService = {
  // Candidate Runtime
  startSession: async (attemptId, payload = {}) => {
    const response = await api.post("/proctoring/sessions/start", {
      attemptId,
      ...payload,
    });
    return response.data;
  },

  recordEvent: async (sessionId, eventData) => {
    const response = await api.post("/proctoring/events", {
      sessionId,
      ...eventData,
    });
    return response.data;
  },

  sendHeartbeat: async (sessionId) => {
    const response = await api.post(`/proctoring/candidate/proctoring/${sessionId}/heartbeat`);
    return response.data;
  },

  endSession: async (sessionId, reason = "") => {
    const response = await api.post(`/proctoring/sessions/${sessionId}/end`, { reason });
    return response.data;
  },

  // Proctor / Staff Monitoring
  getSessionDetails: async (sessionId) => {
    const response = await api.get(`/proctoring/sessions/${sessionId}`);
    return response.data;
  },

  getSessionEvents: async (sessionId, params = {}) => {
    const response = await api.get(`/proctoring/sessions/${sessionId}/events`, { params });
    return response.data;
  },

  getSessionTimeline: async (sessionId) => {
    const response = await api.get(`/proctoring/sessions/${sessionId}/timeline`);
    return response.data;
  },

  getSessionEvidence: async (sessionId) => {
    const response = await api.get(`/proctoring/sessions/${sessionId}/evidence`);
    return response.data;
  },

  getEvidenceById: async (evidenceId) => {
    const response = await api.get(`/proctoring/evidence/${evidenceId}`);
    return response.data;
  },

  sendWarning: async (sessionId, message) => {
    const response = await api.post(`/proctoring/sessions/${sessionId}/warning`, { message });
    return response.data;
  },

  pauseSession: async (sessionId, reason = "") => {
    const response = await api.post(`/proctoring/sessions/${sessionId}/pause`, { reason });
    return response.data;
  },

  terminateSession: async (sessionId, reason) => {
    const response = await api.post(`/proctoring/sessions/${sessionId}/terminate`, { reason });
    return response.data;
  },

  reviewEvent: async (eventId, payload) => {
    const response = await api.patch(`/proctoring/events/${eventId}/review`, payload);
    return response.data;
  },
};

export default proctoringService;
