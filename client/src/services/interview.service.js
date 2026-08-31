import api from './api';

export const interviewService = {
  /**
   * List live interviews for organization
   */
  async getInterviews(params = {}) {
    const response = await api.get('/interviews', { params });
    return response.data || response;
  },

  /**
   * Get single interview by ID
   */
  async getInterviewById(interviewId) {
    const response = await api.get(`/interviews/${interviewId}`);
    return response.data || response;
  },

  /**
   * Schedule new live interview
   */
  async scheduleInterview(data) {
    const response = await api.post('/interviews', data);
    return response.data || response;
  },

  /**
   * Update interview details
   */
  async updateInterview(interviewId, data) {
    const response = await api.patch(`/interviews/${interviewId}`, data);
    return response.data || response;
  },

  /**
   * Cancel interview
   */
  async cancelInterview(interviewId, reason) {
    const response = await api.post(`/interviews/${interviewId}/cancel`, { reason });
    return response.data || response;
  },

  /**
   * Authorize and join live interview room
   */
  async joinInterview(interviewId) {
    const response = await api.post(`/interviews/${interviewId}/join`);
    return response.data || response;
  },

  /**
   * End and finalize live interview room
   */
  async endInterview(interviewId) {
    const response = await api.post(`/interviews/${interviewId}/end`);
    return response.data || response;
  },

  /**
   * Submit interview evaluation / feedback
   */
  async submitFeedback(interviewId, feedbackData) {
    const response = await api.post(`/interviews/${interviewId}/feedback`, feedbackData);
    return response.data || response;
  },
};

export default interviewService;
