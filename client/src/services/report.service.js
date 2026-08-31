import api from './api';

export const reportService = {
  /**
   * Get organization overview analytics dashboard metrics
   */
  async getOverviewMetrics() {
    const response = await api.get('/reports/dashboard');
    return response.data || response;
  },

  /**
   * Get organization overview analytics dashboard metrics alias
   */
  async getDashboard() {
    const response = await api.get('/reports/dashboard');
    return response.data || response;
  },

  /**
   * Get assessment-specific summary & score distribution
   */
  async getAssessmentSummary(assessmentId) {
    const response = await api.get(`/reports/assessments/${assessmentId}/summary`);
    return response.data || response;
  },

  /**
   * Get assessment question item analysis
   */
  async getAssessmentQuestions(assessmentId) {
    const response = await api.get(`/reports/assessments/${assessmentId}/questions`);
    return response.data || response;
  },

  /**
   * Get assessment-specific analytics report alias
   */
  async getAssessmentReport(assessmentId) {
    const response = await api.get(`/reports/assessments/${assessmentId}/summary`);
    return response.data || response;
  },

  /**
   * Get candidate performance report
   */
  async getCandidateReport(candidateId) {
    const response = await api.get(`/reports/candidates/${candidateId}/performance`);
    return response.data || response;
  },

  /**
   * Get platform-wide overview analytics
   */
  async getPlatformOverview() {
    const response = await api.get('/reports/platform/overview');
    return response.data || response;
  },

  /**
   * Get integrity & proctoring risk analytics
   */
  async getIntegrityReport() {
    const response = await api.get('/reports/proctoring');
    return response.data || response;
  },
};

export default reportService;
