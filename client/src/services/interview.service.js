import api from './api';

export const interviewService = {
  /**
   * Helper to get active organization ID
   */
  getOrgId() {
    try {
      const directOrgId = localStorage.getItem('secureassess_current_org_id');
      if (directOrgId) return directOrgId;

      const activeOrg = JSON.parse(localStorage.getItem('secureassess_active_org') || 'null');
      if (activeOrg?.id || activeOrg?._id) return activeOrg.id || activeOrg._id;

      const user = JSON.parse(localStorage.getItem('secureassess_user') || 'null');
      return user?.activeOrganizationId || user?.organizationId || '';
    } catch {
      return '';
    }
  },

  /**
   * List live interviews for organization
   */
  async getInterviews(params = {}) {
    const orgId = this.getOrgId();
    const config = {
      params,
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.get('/interviews', config);
    return response.data || response;
  },

  /**
   * Get candidate's personal interviews
   */
  async getMyInterviews(params = {}) {
    const orgId = this.getOrgId();
    const config = {
      params,
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.get('/interviews/my', config);
    return response.data || response;
  },

  /**
   * Get single interview by ID
   */
  async getInterviewById(interviewId) {
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.get(`/interviews/${interviewId}`, config);
    return response.data || response;
  },

  /**
   * Schedule new live interview
   */
  async scheduleInterview(data) {
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.post('/interviews', data, config);
    return response.data || response;
  },

  /**
   * Update interview details
   */
  async updateInterview(interviewId, data) {
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.patch(`/interviews/${interviewId}`, data, config);
    return response.data || response;
  },

  /**
   * Cancel interview
   */
  async cancelInterview(interviewId, reason) {
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.post(`/interviews/${interviewId}/cancel`, { reason }, config);
    return response.data || response;
  },

  /**
   * Authorize and join live interview room
   */
  async joinInterview(interviewId) {
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.post(`/interviews/${interviewId}/join`, {}, config);
    return response.data || response;
  },

  /**
   * Conclude / End interview session
   */
  async endInterview(interviewId) {
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.post(`/interviews/${interviewId}/end`, {}, config);
    return response.data || response;
  },

  /**
   * Add examiner evaluation note to interview
   */
  async addNote(interviewId, noteData) {
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.post(`/interviews/${interviewId}/notes`, noteData, config);
    return response.data || response;
  },

  /**
   * Get notes for an interview
   */
  async getNotes(interviewId) {
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.get(`/interviews/${interviewId}/notes`, config);
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
    const orgId = this.getOrgId();
    const config = {
      headers: orgId ? { 'x-organization-id': orgId } : {},
    };
    const response = await api.post(`/interviews/${interviewId}/feedback`, feedbackData, config);
    return response.data || response;
  },

  /**
   * Authorize and fetch 1-time guest interview entry
   */
  async getPublicEntryInterview(tokenOrId) {
    const response = await api.get(`/interviews/entry/${tokenOrId}`);
    return response.data || response;
  },
};

export default interviewService;

