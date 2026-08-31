import api from './api';

export const academicService = {
  // --- Departments ---
  getDepartments: async (organizationId) => {
    const response = await api.get(`/departments?organizationId=${organizationId}`);
    return response.data?.data || response.data || [];
  },

  createDepartment: async (data) => {
    const response = await api.post('/departments', data);
    return response.data?.data || response.data;
  },

  // --- Programs ---
  getPrograms: async (organizationId, departmentId = null) => {
    let url = `/programs?organizationId=${organizationId}`;
    if (departmentId) url += `&departmentId=${departmentId}`;
    const response = await api.get(url);
    return response.data?.data || response.data || [];
  },

  createProgram: async (data) => {
    const response = await api.post('/programs', data);
    return response.data?.data || response.data;
  },

  // --- Subjects ---
  getSubjects: async (organizationId, programId = null) => {
    let url = `/subjects?organizationId=${organizationId}`;
    if (programId) url += `&programId=${programId}`;
    const response = await api.get(url);
    return response.data?.data || response.data || [];
  },

  createSubject: async (data) => {
    const response = await api.post('/subjects', data);
    return response.data?.data || response.data;
  },
};

export default academicService;
