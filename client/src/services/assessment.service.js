import api from './api';

export const assessmentService = {
  /**
   * Fetch all assessments for current tenant organization
   */
  async getAssessments(params = {}, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments` : '/assessments';
    const response = await api.get(url, { params });
    return response.data || response;
  },

  /**
   * Fetch a single assessment by ID
   */
  async getAssessmentById(id, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${id}` : `/assessments/${id}`;
    const response = await api.get(url);
    return response.data || response;
  },

  /**
   * Create a new assessment
   */
  async createAssessment(data, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments` : '/assessments';
    const response = await api.post(url, data);
    return response.data || response;
  },

  /**
   * Update an assessment
   */
  async updateAssessment(id, data, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${id}` : `/assessments/${id}`;
    const response = await api.patch(url, data);
    return response.data || response;
  },

  /**
   * Delete an assessment
   */
  async deleteAssessment(id, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${id}` : `/assessments/${id}`;
    const response = await api.delete(url);
    return response.data || response;
  },

  /**
   * Publish an assessment
   */
  async publishAssessment(id, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${id}/publish` : `/assessments/${id}/publish`;
    const response = await api.post(url);
    return response.data || response;
  },

  /**
   * Archive an assessment
   */
  async archiveAssessment(id, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${id}/archive` : `/assessments/${id}/archive`;
    const response = await api.post(url);
    return response.data || response;
  },

  /**
   * Add a question to an assessment
   */
  async createAssessmentQuestion(assessmentId, data, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${assessmentId}/questions` : `/assessments/${assessmentId}/questions`;
    const response = await api.post(url, data);
    return response.data || response;
  },

  /**
   * Bulk add questions to an assessment
   */
  async bulkAddAssessmentQuestions(assessmentId, data, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${assessmentId}/questions/bulk` : `/assessments/${assessmentId}/questions/bulk`;
    const response = await api.post(url, data);
    return response.data || response;
  },

  /**
   * Fetch all questions in an assessment
   */
  async getAssessmentQuestions(assessmentId, params = {}, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${assessmentId}/questions` : `/assessments/${assessmentId}/questions`;
    const response = await api.get(url, { params });
    return response.data || response;
  },

  /**
   * Add a section to an assessment
   */
  async createAssessmentSection(assessmentId, data, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${assessmentId}/sections` : `/assessments/${assessmentId}/sections`;
    const response = await api.post(url, data);
    return response.data || response;
  },

  /**
   * Fetch all sections in an assessment
   */
  async getAssessmentSections(assessmentId, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${assessmentId}/sections` : `/assessments/${assessmentId}/sections`;
    const response = await api.get(url);
    return response.data || response;
  },

  /**
   * Assign assessment to candidate or candidate group
   */
  async assignAssessment(assessmentId, data, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${assessmentId}/assignments` : `/assessments/${assessmentId}/assignments`;
    const response = await api.post(url, data);
    return response.data || response;
  },

  /**
   * List assignments for assessment
   */
  async getAssignments(assessmentId, params = {}, orgId = null) {
    const url = orgId ? `/organizations/${orgId}/assessments/${assessmentId}/assignments` : `/assessments/${assessmentId}/assignments`;
    const response = await api.get(url, { params });
    return response.data || response;
  },
};

export default assessmentService;
