import { NotificationService } from "./notification.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId || null;

  const result = await NotificationService.getUserNotifications(
    userId,
    organizationId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notifications retrieved successfully"));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId || null;

  const result = await NotificationService.getUnreadCount(userId, organizationId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Unread count retrieved successfully"));
});

export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { notificationId } = req.params;

  const result = await NotificationService.markAsRead(userId, notificationId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notification marked as read"));
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId || null;

  const result = await NotificationService.markAllAsRead(userId, organizationId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "All notifications marked as read"));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const { notificationId } = req.params;

  const result = await NotificationService.softDeleteNotification(
    userId,
    notificationId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notification deleted successfully"));
});

export const getPreferences = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await NotificationService.getPreferences(userId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Preferences retrieved successfully"));
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const result = await NotificationService.updatePreferences(userId, req.body);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Preferences updated successfully"));
});

export const createNotification = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId || null;
  const result = await NotificationService.createNotification({
    ...req.body,
    organizationId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Notification created successfully"));
});

export const retryNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const result = await NotificationService.retryNotification(notificationId);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Notification retry processed"));
});
