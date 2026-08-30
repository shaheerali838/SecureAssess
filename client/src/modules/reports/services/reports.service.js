import api from "../../../services/api";

export const reportsService = {
  getOrganizationDashboard: async (params = {}) => {
    const response = await api.get("/reports/dashboard", { params });
    return response.data;
  },

  getPlatformDashboard: async () => {
    const response = await api.get("/reports/platform/overview");
    return response.data;
  },

  getAssessmentSummary: async (assessmentId, params = {}) => {
    const response = await api.get(`/reports/assessments/${assessmentId}/summary`, { params });
    return response.data;
  },

  getAssessmentQuestions: async (assessmentId) => {
    const response = await api.get(`/reports/assessments/${assessmentId}/questions`);
    return response.data;
  },

  getAssessmentResults: async (assessmentId) => {
    const response = await api.get(`/reports/assessments/${assessmentId}/results`);
    return response.data;
  },

  getAssessmentProctoring: async (assessmentId) => {
    const response = await api.get(`/reports/assessments/${assessmentId}/proctoring`);
    return response.data;
  },

  getCandidatePerformance: async (candidateId, params = {}) => {
    const response = await api.get(`/reports/candidates/${candidateId}/performance`, { params });
    return response.data;
  },

  exportAssessment: async (assessmentId, format = "CSV") => {
    const response = await api.get(`/reports/assessments/${assessmentId}/export`, {
      params: { format },
      responseType: format === "CSV" ? "blob" : "json",
    });
    return response.data;
  },

  listReports: async (params = {}) => {
    const response = await api.get("/reports", { params });
    return response.data;
  },
};

export default reportsService;
