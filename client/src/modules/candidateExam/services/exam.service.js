import api from '../../../services/api';

export const examService = {
  startAttempt: async (assignmentId, organizationId = null) => {
    const payload = { assignmentId };
    if (organizationId) payload.organizationId = organizationId;
    return api.post('/attempts/start', payload);
  },

  getAttempt: async (attemptId) => {
    return api.get(`/attempts/${attemptId}`);
  },

  getAttemptQuestions: async (attemptId) => {
    return api.get(`/attempts/${attemptId}/questions`);
  },

  getAttemptQuestion: async (attemptId, questionId) => {
    return api.get(`/attempts/${attemptId}/questions/${questionId}`);
  },

  saveAnswer: async (attemptId, questionId, answer) => {
    return api.put(`/attempts/${attemptId}/questions/${questionId}/answer`, { answer });
  },

  flagQuestion: async (attemptId, questionId, flagged = true) => {
    return api.patch(`/attempts/${attemptId}/questions/${questionId}/flag`, { flagged });
  },

  sendHeartbeat: async (attemptId) => {
    return api.post(`/attempts/${attemptId}/heartbeat`);
  },

  submitAttempt: async (attemptId) => {
    return api.post(`/attempts/${attemptId}/submit`);
  },
};

export default examService;
