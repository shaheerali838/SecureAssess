import api from './api';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const getOrgId = (explicitOrgId) => {
  const candidate = explicitOrgId || localStorage.getItem('secureassess_current_org_id');
  return isValidObjectId(candidate) ? candidate : null;
};

export const subjectService = {
  async getSubjects(params = {}, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/subjects`, { params });
        return response.data || response;
      }
      const response = await api.get('/subjects', { params });
      return response.data || response;
    } catch {
      try {
        const response = await api.get('/subjects', { params });
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  async getSubjectById(subjectId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/subjects/${subjectId}`);
        return response.data || response;
      }
      const response = await api.get(`/subjects/${subjectId}`);
      return response.data || response;
    } catch {
      const response = await api.get(`/subjects/${subjectId}`);
      return response.data || response;
    }
  },

  async createSubject(data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.post(`/organizations/${orgId}/subjects`, data);
        return response.data || response;
      }
      const response = await api.post('/subjects', data);
      return response.data || response;
    } catch {
      const response = await api.post('/subjects', data);
      return response.data || response;
    }
  },

  async updateSubject(subjectId, data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.patch(`/organizations/${orgId}/subjects/${subjectId}`, data);
        return response.data || response;
      }
      const response = await api.patch(`/subjects/${subjectId}`, data);
      return response.data || response;
    } catch {
      const response = await api.patch(`/subjects/${subjectId}`, data);
      return response.data || response;
    }
  },

  async deleteSubject(subjectId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.delete(`/organizations/${orgId}/subjects/${subjectId}`);
        return response.data || response;
      }
      const response = await api.delete(`/subjects/${subjectId}`);
      return response.data || response;
    } catch {
      const response = await api.delete(`/subjects/${subjectId}`);
      return response.data || response;
    }
  },
};

export default subjectService;
