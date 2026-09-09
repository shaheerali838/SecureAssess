import api from './api';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const getOrgId = (explicitOrgId) => {
  const candidate = explicitOrgId || localStorage.getItem('secureassess_current_org_id');
  return isValidObjectId(candidate) ? candidate : null;
};

export const rubricService = {
  async getRubrics(params = {}, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/rubrics`, { params });
        return response.data || response;
      }
      const response = await api.get('/rubrics', { params });
      return response.data || response;
    } catch {
      try {
        const response = await api.get('/rubrics', { params });
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  async getRubricById(rubricId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/rubrics/${rubricId}`);
        return response.data || response;
      }
      const response = await api.get(`/rubrics/${rubricId}`);
      return response.data || response;
    } catch {
      const response = await api.get(`/rubrics/${rubricId}`);
      return response.data || response;
    }
  },

  async createRubric(data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.post(`/organizations/${orgId}/rubrics`, data);
        return response.data || response;
      }
      const response = await api.post('/rubrics', data);
      return response.data || response;
    } catch {
      const response = await api.post('/rubrics', data);
      return response.data || response;
    }
  },

  async updateRubric(rubricId, data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.patch(`/organizations/${orgId}/rubrics/${rubricId}`, data);
        return response.data || response;
      }
      const response = await api.patch(`/rubrics/${rubricId}`, data);
      return response.data || response;
    } catch {
      const response = await api.patch(`/rubrics/${rubricId}`, data);
      return response.data || response;
    }
  },

  async deleteRubric(rubricId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.delete(`/organizations/${orgId}/rubrics/${rubricId}`);
        return response.data || response;
      }
      const response = await api.delete(`/rubrics/${rubricId}`);
      return response.data || response;
    } catch {
      const response = await api.delete(`/rubrics/${rubricId}`);
      return response.data || response;
    }
  },
};

export default rubricService;
