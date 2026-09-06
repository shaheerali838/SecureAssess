import api from './api';

export const departmentService = {
  getDepartments: async (params = {}, orgId) => {
    const response = await api.get('/departments', { params });
    return response.data || response;
  },
  getDepartment: async (id, orgId) => {
    const response = await api.get(`/departments/${id}`);
    return response.data || response;
  },
  createDepartment: async (data, orgId) => {
    const response = await api.post('/departments', data);
    return response.data || response;
  },
  updateDepartment: async (id, data, orgId) => {
    const response = await api.patch(`/departments/${id}`, data);
    return response.data || response;
  },
  updateDepartmentStatus: async (id, status, orgId) => {
    const response = await api.patch(`/departments/${id}/status`, { status });
    return response.data || response;
  },
  deleteDepartment: async (id, orgId) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data || response;
  },
};

export default departmentService;
