import api from './api';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const getOrgId = (explicitOrgId) => {
  const candidate = explicitOrgId || localStorage.getItem('secureassess_current_org_id');
  return isValidObjectId(candidate) ? candidate : null;
};

export const departmentService = {
  async getDepartments(params = {}, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/departments`, { params });
        return response.data || response;
      }
      const response = await api.get('/departments', { params });
      return response.data || response;
    } catch {
      try {
        const response = await api.get('/departments', { params });
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  async getDepartmentById(departmentId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/departments/${departmentId}`);
        return response.data || response;
      }
      const response = await api.get(`/departments/${departmentId}`);
      return response.data || response;
    } catch {
      const response = await api.get(`/departments/${departmentId}`);
      return response.data || response;
    }
  },

  async createDepartment(data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.post(`/organizations/${orgId}/departments`, data);
        return response.data || response;
      }
      const response = await api.post('/departments', data);
      return response.data || response;
    } catch {
      const response = await api.post('/departments', data);
      return response.data || response;
    }
  },

  async updateDepartment(departmentId, data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.patch(`/organizations/${orgId}/departments/${departmentId}`, data);
        return response.data || response;
      }
      const response = await api.patch(`/departments/${departmentId}`, data);
      return response.data || response;
    } catch {
      const response = await api.patch(`/departments/${departmentId}`, data);
      return response.data || response;
    }
  },

  async deleteDepartment(departmentId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.delete(`/organizations/${orgId}/departments/${departmentId}`);
        return response.data || response;
      }
      const response = await api.delete(`/departments/${departmentId}`);
      return response.data || response;
    } catch {
      const response = await api.delete(`/departments/${departmentId}`);
      return response.data || response;
    }
  },
};

export default departmentService;
