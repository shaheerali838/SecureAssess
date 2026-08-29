import { useState, useEffect, useCallback } from "react";
import { notificationService } from "../services/notification.service";

export const useNotifications = (autoRefresh = true, pollIntervalMs = 15000) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (params = {}) => {
    try {
      setIsLoading(true);
      const res = await notificationService.getNotifications(params);
      setNotifications(res.data?.items || []);
      setUnreadCount(res.data?.unreadCount || 0);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0 });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data?.count || 0);
    } catch (err) {
      console.warn("Fetch unread count failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    if (autoRefresh) {
      const interval = setInterval(fetchUnreadCount, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, fetchUnreadCount, autoRefresh, pollIntervalMs]);

  const markAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, readAt: new Date(), status: "READ" } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date(), status: "READ" }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId) => {
    await notificationService.deleteNotification(notificationId);
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
  };

  return {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

export default useNotifications;
