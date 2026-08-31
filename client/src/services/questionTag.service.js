import api from './api';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const getOrgId = (explicitOrgId) => {
  const candidate = explicitOrgId || localStorage.getItem('secureassess_current_org_id');
  return isValidObjectId(candidate) ? candidate : null;
};

export const questionTagService = {
  /**
   * Get all question tags
   */
  async getTags(params = {}, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/question-tags`, { params });
        return response.data || response;
      }
      const response = await api.get('/question-tags', { params });
      return response.data || response;
    } catch {
      try {
        const response = await api.get('/question-tags', { params });
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  /**
   * Create question tag
   */
  async createTag(data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.post(`/organizations/${orgId}/question-tags`, data);
        return response.data || response;
      }
      const response = await api.post('/question-tags', data);
      return response.data || response;
    } catch {
      const response = await api.post('/question-tags', data);
      return response.data || response;
    }
  },

  /**
   * Delete tag
   */
  async deleteTag(tagId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.delete(`/organizations/${orgId}/question-tags/${tagId}`);
        return response.data || response;
      }
      const response = await api.delete(`/question-tags/${tagId}`);
      return response.data || response;
    } catch {
      const response = await api.delete(`/question-tags/${tagId}`);
      return response.data || response;
    }
  },
};

export default questionTagService;
