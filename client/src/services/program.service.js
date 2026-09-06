import api from './api';

export const programService = {
  getPrograms: async (params = {}, orgId) => {
    const response = await api.get('/programs', { params });
    return response.data || response;
  },
  getProgram: async (id, orgId) => {
    const response = await api.get(`/programs/${id}`);
    return response.data || response;
  },
  createProgram: async (data, orgId) => {
    const response = await api.post('/programs', data);
    return response.data || response;
  },
  updateProgram: async (id, data, orgId) => {
    const response = await api.patch(`/programs/${id}`, data);
    return response.data || response;
  },
  updateProgramStatus: async (id, status, orgId) => {
    const response = await api.patch(`/programs/${id}/status`, { status });
    return response.data || response;
  },
  deleteProgram: async (id, orgId) => {
    const response = await api.delete(`/programs/${id}`);
    return response.data || response;
  },
};

export default programService;
