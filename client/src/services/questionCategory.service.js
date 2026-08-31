import api from './api';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const getOrgId = (explicitOrgId) => {
  const candidate = explicitOrgId || localStorage.getItem('secureassess_current_org_id');
  return isValidObjectId(candidate) ? candidate : null;
};

export const questionCategoryService = {
  /**
   * Get all question categories
   */
  async getCategories(params = {}, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/question-categories`, { params });
        return response.data || response;
      }
      const response = await api.get('/question-categories', { params });
      return response.data || response;
    } catch {
      try {
        const response = await api.get('/question-categories', { params });
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  /**
   * Create question category
   */
  async createCategory(data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.post(`/organizations/${orgId}/question-categories`, data);
        return response.data || response;
      }
      const response = await api.post('/question-categories', data);
      return response.data || response;
    } catch {
      const response = await api.post('/question-categories', data);
      return response.data || response;
    }
  },

  /**
   * Update category
   */
  async updateCategory(categoryId, data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.patch(`/organizations/${orgId}/question-categories/${categoryId}`, data);
        return response.data || response;
      }
      const response = await api.patch(`/question-categories/${categoryId}`, data);
      return response.data || response;
    } catch {
      const response = await api.patch(`/question-categories/${categoryId}`, data);
      return response.data || response;
    }
  },

  /**
   * Delete category
   */
  async deleteCategory(categoryId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.delete(`/organizations/${orgId}/question-categories/${categoryId}`);
        return response.data || response;
      }
      const response = await api.delete(`/question-categories/${categoryId}`);
      return response.data || response;
    } catch {
      const response = await api.delete(`/question-categories/${categoryId}`);
      return response.data || response;
    }
  },
};

export default questionCategoryService;
