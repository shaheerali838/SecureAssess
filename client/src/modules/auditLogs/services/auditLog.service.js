import api from "../../../services/api";

export const auditLogService = {
  getAuditLogs: async (params = {}) => {
    const response = await api.get("/audit-logs", { params });
    return response.data;
  },

  getAuditLogById: async (auditLogId) => {
    const response = await api.get(`/audit-logs/${auditLogId}`);
    return response.data;
  },

  getResourceAuditLogs: async (resource, resourceId, params = {}) => {
    const response = await api.get(`/audit-logs/resource/${resource}/${resourceId}`, { params });
    return response.data;
  },

  getUserAuditLogs: async (userId, params = {}) => {
    const response = await api.get(`/audit-logs/user/${userId}`, { params });
    return response.data;
  },

  exportAuditLogs: async (params = {}) => {
    const response = await api.get("/audit-logs/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};

export default auditLogService;
