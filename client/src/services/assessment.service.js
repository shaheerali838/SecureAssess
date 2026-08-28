import api from './api';

export const assessmentService = {
  /**
   * Fetch all assessments for current tenant organization
   */
  async getAssessments(params = {}) {
    const response = await api.get('/assessments', { params });
    return response.data || response;
  },

  /**
   * Fetch a single assessment by ID
   */
  async getAssessmentById(id) {
    const response = await api.get(`/assessments/${id}`);
    return response.data || response;
  },

  /**
   * Create a new assessment
   */
  async createAssessment(data) {
    const response = await api.post('/assessments', data);
    return response.data || response;
  },

  /**
   * Update an assessment
   */
  async updateAssessment(id, data) {
    const response = await api.patch(`/assessments/${id}`, data);
    return response.data || response;
  },

  /**
   * Delete an assessment
   */
  async deleteAssessment(id) {
    const response = await api.delete(`/assessments/${id}`);
    return response.data || response;
  },

  /**
   * Publish an assessment
   */
  async publishAssessment(id) {
    const response = await api.post(`/assessments/${id}/publish`);
    return response.data || response;
  },

  /**
   * Add a question to an assessment
   */
  async createAssessmentQuestion(assessmentId, data) {
    const response = await api.post(`/assessments/${assessmentId}/questions`, data);
    return response.data || response;
  },
};

export default assessmentService;
