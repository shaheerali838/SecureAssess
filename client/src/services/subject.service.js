import api from './api';

export const subjectService = {
  getSubjects: async (params = {}, orgId) => {
    const response = await api.get('/subjects', { params });
    return response.data || response;
  },
  getSubject: async (id, orgId) => {
    const response = await api.get(`/subjects/${id}`);
    return response.data || response;
  },
  createSubject: async (data, orgId) => {
    const response = await api.post('/subjects', data);
    return response.data || response;
  },
  updateSubject: async (id, data, orgId) => {
    const response = await api.patch(`/subjects/${id}`, data);
    return response.data || response;
  },
  updateSubjectStatus: async (id, status, orgId) => {
    const response = await api.patch(`/subjects/${id}/status`, { status });
    return response.data || response;
  },
  deleteSubject: async (id, orgId) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data || response;
  },
};

export default subjectService;
