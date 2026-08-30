import api from './api';

export const auditLogService = {
  /**
   * List audit logs for current organization
   */
  async getAuditLogs(params = {}) {
    const response = await api.get('/audit-logs', { params });
    return response.data || response;
  },
};

export default auditLogService;
