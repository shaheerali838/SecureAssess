import { NotificationService as ModuleNotificationService } from "../../modules/notifications/notification.service.js";
import { logger } from "../../config/logger.js";

export class NotificationService {
  /**
   * Main dispatch method for all domain modules
   */
  static async notify(params) {
    return ModuleNotificationService.notify(params);
  }

  static async sendInAppNotification({ userId, title, message, type = "SYSTEM_ALERT", meta = {}, organizationId = null }) {
    logger.info(`[NotificationService] In-App Notification to user: ${userId} - ${title}`);
    return ModuleNotificationService.createNotification({
      recipientId: userId,
      organizationId,
      title,
      message,
      type,
      channel: "IN_APP",
      data: meta,
    });
  }

  static async broadcastToRoom(io, roomId, event, payload) {
    if (io) {
      logger.info(`[NotificationService] Broadcasting event '${event}' to room: ${roomId}`);
      io.to(roomId).emit(event, payload);
    }
  }
}
