import api from './api';

export const authService = {
  /**
   * Universal Login
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data || response;
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('secureassess_access_token');
      localStorage.removeItem('secureassess_refresh_token');
      localStorage.removeItem('secureassess_user');
      localStorage.removeItem('secureassess_current_org_id');
    }
  },

  /**
   * Fetch current authenticated user identity
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data || response;
  },

  /**
   * Request password reset token
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data || response;
  },

  /**
   * Reset password using token
   */
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data || response;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data || response;
  },
};

export default authService;
