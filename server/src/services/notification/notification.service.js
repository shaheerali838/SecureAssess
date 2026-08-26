import { logger } from "../../config/logger.js";

export class NotificationService {
  static async sendInAppNotification({ userId, title, message, type = "INFO", meta = {} }) {
    logger.info(`[NotificationService] In-App Notification to user: ${userId} - ${title}`);
    return {
      id: `notif_${Date.now()}`,
      userId,
      title,
      message,
      type,
      meta,
      read: false,
      createdAt: new Date(),
    };
  }

  static async broadcastToRoom(io, roomId, event, payload) {
    if (io) {
      io.to(roomId).emit(event, payload);
    }
  }
}
