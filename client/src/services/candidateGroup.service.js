import api from './api';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const getOrgId = (explicitOrgId) => {
  const candidate = explicitOrgId || localStorage.getItem('secureassess_current_org_id');
  return isValidObjectId(candidate) ? candidate : null;
};

export const candidateGroupService = {
  async getCandidateGroups(params = {}, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/candidate-groups`, { params });
        return response.data || response;
      }
      const response = await api.get('/candidate-groups', { params });
      return response.data || response;
    } catch {
      try {
        const response = await api.get('/candidate-groups', { params });
        return response.data || response;
      } catch {
        return [];
      }
    }
  },

  async getCandidateGroupById(groupId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.get(`/organizations/${orgId}/candidate-groups/${groupId}`);
        return response.data || response;
      }
      const response = await api.get(`/candidate-groups/${groupId}`);
      return response.data || response;
    } catch {
      const response = await api.get(`/candidate-groups/${groupId}`);
      return response.data || response;
    }
  },

  async createCandidateGroup(data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.post(`/organizations/${orgId}/candidate-groups`, data);
        return response.data || response;
      }
      const response = await api.post('/candidate-groups', data);
      return response.data || response;
    } catch {
      const response = await api.post('/candidate-groups', data);
      return response.data || response;
    }
  },

  async updateCandidateGroup(groupId, data, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.patch(`/organizations/${orgId}/candidate-groups/${groupId}`, data);
        return response.data || response;
      }
      const response = await api.patch(`/candidate-groups/${groupId}`, data);
      return response.data || response;
    } catch {
      const response = await api.patch(`/candidate-groups/${groupId}`, data);
      return response.data || response;
    }
  },

  async deleteCandidateGroup(groupId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.delete(`/organizations/${orgId}/candidate-groups/${groupId}`);
        return response.data || response;
      }
      const response = await api.delete(`/candidate-groups/${groupId}`);
      return response.data || response;
    } catch {
      const response = await api.delete(`/candidate-groups/${groupId}`);
      return response.data || response;
    }
  },

  async addCandidatesToGroup(groupId, candidateIds, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.post(`/organizations/${orgId}/candidate-groups/${groupId}/members`, {
          candidateIds,
        });
        return response.data || response;
      }
      const response = await api.post(`/candidate-groups/${groupId}/members`, { candidateIds });
      return response.data || response;
    } catch {
      const response = await api.post(`/candidate-groups/${groupId}/members`, { candidateIds });
      return response.data || response;
    }
  },

  async removeCandidateFromGroup(groupId, candidateId, explicitOrgId = null) {
    const orgId = getOrgId(explicitOrgId);
    try {
      if (orgId) {
        const response = await api.delete(`/organizations/${orgId}/candidate-groups/${groupId}/members/${candidateId}`);
        return response.data || response;
      }
      const response = await api.delete(`/candidate-groups/${groupId}/members/${candidateId}`);
      return response.data || response;
    } catch {
      const response = await api.delete(`/candidate-groups/${groupId}/members/${candidateId}`);
      return response.data || response;
    }
  },

  async getGroups(params = {}, explicitOrgId = null) {
    return this.getCandidateGroups(params, explicitOrgId);
  },
};

export default candidateGroupService;
