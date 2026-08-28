import api from './api';

export const userService = {
  /**
   * Fetch users / faculty / staff for current organization
   */
  async getOrgUsers(params = {}) {
    const response = await api.get('/users', { params });
    return response.data || response;
  },

  /**
   * Invite / Add a new staff member to organization
   */
  async inviteUser(data) {
    const response = await api.post('/users', data);
    return response.data || response;
  },

  /**
   * Update user role or permissions
   */
  async updateUser(id, data) {
    const response = await api.patch(`/users/${id}`, data);
    return response.data || response;
  },

  /**
   * Remove a user from the organization
   */
  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data || response;
  },
};

export default userService;
