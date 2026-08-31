import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  createNotification,
  retryNotification,
} from "./notification.controller.js";
import {
  createNotificationSchema,
  updatePreferencesSchema,
} from "./notification.validation.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// GET /api/v1/notifications - List user's notifications (with pagination & unread filter)
router.get("/", requireAuth, getUserNotifications);

// GET /api/v1/notifications/unread-count or /unread - Get unread notification counter for badge
router.get("/unread-count", requireAuth, getUnreadCount);
router.get("/unread", requireAuth, getUnreadCount);

// GET /api/v1/notifications/preferences - Get user's notification preferences
router.get("/preferences", requireAuth, getPreferences);

// PATCH /api/v1/notifications/preferences - Update user's notification preferences
router.patch(
  "/preferences",
  requireAuth,
  validateRequest(updatePreferencesSchema),
  updatePreferences
);

// PATCH /api/v1/notifications/read-all - Mark all user notifications as read
router.patch("/read-all", requireAuth, markAllAsRead);

// PATCH /api/v1/notifications/:notificationId/read - Mark single notification as read
router.patch("/:notificationId/read", requireAuth, markAsRead);

// DELETE /api/v1/notifications/:notificationId - Soft delete notification
router.delete("/:notificationId", requireAuth, deleteNotification);

// POST /api/v1/notifications/:notificationId/retry - Retry failed notification
router.post("/:notificationId/retry", requireAuth, retryNotification);

// POST /api/v1/notifications - Create notification manually
router.post(
  "/",
  requireAuth,
  validateRequest(createNotificationSchema),
  createNotification
);

export default router;
