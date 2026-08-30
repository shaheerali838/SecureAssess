import api from './api';

export const reportService = {
  /**
   * Get organization overview analytics dashboard metrics
   */
  async getOverviewMetrics() {
    const response = await api.get('/reports/overview');
    return response.data || response;
  },

  /**
   * Get assessment-specific analytics report
   */
  async getAssessmentReport(assessmentId) {
    const response = await api.get(`/reports/assessments/${assessmentId}`);
    return response.data || response;
  },

  /**
   * Get integrity & proctoring risk analytics
   */
  async getIntegrityReport() {
    const response = await api.get('/reports/integrity');
    return response.data || response;
  },
};

export default reportService;
