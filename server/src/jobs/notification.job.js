import Notification from "../modules/notifications/notification.model.js";
import User from "../modules/users/user.model.js";
import { EmailService } from "../services/email/email.service.js";
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from "../modules/notifications/notification.constants.js";
import { logger } from "../config/logger.js";

export const runNotificationJob = async (batchSize = 50) => {
  logger.info("[Job] Processing queued notifications...");

  const pendingNotifications = await Notification.find({
    status: NOTIFICATION_STATUSES.PENDING,
    deletedAt: null,
  })
    .limit(batchSize)
    .sort({ createdAt: 1 });

  let sentCount = 0;
  let failedCount = 0;

  for (const notif of pendingNotifications) {
    try {
      notif.status = NOTIFICATION_STATUSES.PROCESSING;
      await notif.save();

      if (notif.channel === NOTIFICATION_CHANNELS.EMAIL) {
        const recipient = await User.findById(notif.recipientId);
        if (recipient && recipient.email) {
          await EmailService.sendEmail({
            to: recipient.email,
            subject: notif.title,
            html: `<p>${notif.message}</p>`,
            text: notif.message,
          });
        }
      }

      notif.status = NOTIFICATION_STATUSES.SENT;
      notif.sentAt = new Date();
      await notif.save();
      sentCount++;
    } catch (err) {
      logger.error(`[Job] Failed to process notification ${notif._id}: ${err.message}`);
      notif.status = NOTIFICATION_STATUSES.FAILED;
      notif.metadata = { ...(notif.metadata || {}), error: err.message };
      await notif.save();
      failedCount++;
    }
  }

  return {
    processed: pendingNotifications.length,
    sent: sentCount,
    failed: failedCount,
  };
};
