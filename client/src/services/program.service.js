import api from './api';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const getOrgId = (explicitOrgId) => {
  const candidate = explicitOrgId || localStorage.getItem('secureassess_current_org_id');
  return isValidObjectId(candidate) ? candidate : null;
};

export const programService = {
  async getPrograms(params = {}, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/programs`, { params });
        return response.data || response;
      }
      const response = await api.get('/programs', { params });
      return response.data || response;
    } catch {
      try {
        const response = await api.get('/programs', { params });
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  async getProgramById(programId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/programs/${programId}`);
        return response.data || response;
      }
      const response = await api.get(`/programs/${programId}`);
      return response.data || response;
    } catch {
      const response = await api.get(`/programs/${programId}`);
      return response.data || response;
    }
  },

  async createProgram(data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.post(`/organizations/${orgId}/programs`, data);
        return response.data || response;
      }
      const response = await api.post('/programs', data);
      return response.data || response;
    } catch {
      const response = await api.post('/programs', data);
      return response.data || response;
    }
  },

  async updateProgram(programId, data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.patch(`/organizations/${orgId}/programs/${programId}`, data);
        return response.data || response;
      }
      const response = await api.patch(`/programs/${programId}`, data);
      return response.data || response;
    } catch {
      const response = await api.patch(`/programs/${programId}`, data);
      return response.data || response;
    }
  },

  async deleteProgram(programId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.delete(`/organizations/${orgId}/programs/${programId}`);
        return response.data || response;
      }
      const response = await api.delete(`/programs/${programId}`);
      return response.data || response;
    } catch {
      const response = await api.delete(`/programs/${programId}`);
      return response.data || response;
    }
  },
};

export default programService;
