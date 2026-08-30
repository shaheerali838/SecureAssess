import api from './api';

export const notificationService = {
  /**
   * Get paginated notifications for current user
   */
  async getNotifications(params = {}) {
    const response = await api.get('/notifications', { params });
    return response.data || response;
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data || response;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId) {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data || response;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const response = await api.post('/notifications/mark-all-read');
    return response.data || response;
  },

  /**
   * Get user notification preferences
   */
  async getPreferences() {
    const response = await api.get('/notifications/preferences');
    return response.data || response;
  },

  /**
   * Update user notification preferences
   */
  async updatePreferences(preferences) {
    const response = await api.patch('/notifications/preferences', preferences);
    return response.data || response;
  },
};

export default notificationService;
