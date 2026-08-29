import mongoose from "mongoose";
import Notification from "./notification.model.js";
import NotificationPreference from "./notificationPreference.model.js";
import User from "../users/user.model.js";
import { EmailService } from "../../services/email/email.service.js";
import { NOTIFICATION_TEMPLATES } from "./notification.templates.js";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_PRIORITIES,
  CRITICAL_NOTIFICATION_TYPES,
} from "./notification.constants.js";
import { ApiError } from "../../utils/ApiError.js";

export class NotificationService {
  /**
   * Retrieves or initializes default notification preferences for a user
   */
  static async getPreferences(userId) {
    let pref = await NotificationPreference.findOne({ userId });
    if (!pref) {
      pref = await NotificationPreference.create({ userId });
    }
    return pref;
  }

  /**
   * Updates user notification preferences
   */
  static async updatePreferences(userId, updateData = {}) {
    const pref = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { upsert: true, returnDocument: "after" }
    );
    return pref;
  }

  /**
   * Creates a single notification record with idempotency and preference checks
   */
  static async createNotification({
    organizationId = null,
    recipientId,
    senderId = null,
    type,
    channel = NOTIFICATION_CHANNELS.IN_APP,
    priority = NOTIFICATION_PRIORITIES.NORMAL,
    title,
    message,
    data = {},
    idempotencyKey = null,
    immediate = false,
    expiresAt = null,
  }) {
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new ApiError(400, "Invalid recipient ID format");
    }

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await Notification.findOne({ idempotencyKey });
      if (existing) {
        return existing;
      }
    }

    const template = NOTIFICATION_TEMPLATES[type] || {};
    const finalTitle = title || template.title || "SecureAssess Notification";
    const finalMessage =
      message ||
      (template.formatMessage ? template.formatMessage(data) : "You have a new SecureAssess notification.");

    // 2. Check Preferences for Non-Critical Notifications
    const isCritical = CRITICAL_NOTIFICATION_TYPES.includes(type) || priority === NOTIFICATION_PRIORITIES.URGENT;
    if (!isCritical) {
      const pref = await this.getPreferences(recipientId);
      if (channel === NOTIFICATION_CHANNELS.IN_APP && pref.inApp?.enabled === false) {
        return null;
      }
      if (channel === NOTIFICATION_CHANNELS.EMAIL && pref.email?.enabled === false) {
        return null;
      }
    }

    const isInitialSent = channel === NOTIFICATION_CHANNELS.IN_APP || channel === NOTIFICATION_CHANNELS.REALTIME;
    const notification = await Notification.create({
      organizationId,
      recipientId,
      senderId,
      type,
      channel,
      priority,
      title: finalTitle,
      message: finalMessage,
      data,
      idempotencyKey: idempotencyKey || null,
      status: isInitialSent ? NOTIFICATION_STATUSES.SENT : NOTIFICATION_STATUSES.PENDING,
      sentAt: isInitialSent ? new Date() : null,
      expiresAt: expiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });

    // 3. Immediate Email Dispatch if requested
    if (channel === NOTIFICATION_CHANNELS.EMAIL && immediate) {
      try {
        const recipient = await User.findById(recipientId);
        if (recipient && recipient.email) {
          await EmailService.sendEmail({
            to: recipient.email,
            subject: finalTitle,
            html: `<p>${finalMessage}</p>`,
            text: finalMessage,
          });
          notification.status = NOTIFICATION_STATUSES.SENT;
          notification.sentAt = new Date();
          await notification.save();
        }
      } catch (err) {
        notification.status = NOTIFICATION_STATUSES.FAILED;
        notification.failureReason = err.message;
        notification.failedAt = new Date();
        await notification.save();
      }
    }

    return notification;
  }

  /**
   * Alias dispatcher for sending a notification
   */
  static async sendNotification(payload) {
    return this.createNotification(payload);
  }

  /**
   * Dispatches bulk notifications (e.g. assigning assessment to multiple candidates)
   */
  static async sendBulkNotifications({
    organizationId = null,
    recipientIds = [],
    type,
    channels = [NOTIFICATION_CHANNELS.IN_APP],
    title,
    message,
    data = {},
    priority = NOTIFICATION_PRIORITIES.NORMAL,
  }) {
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return { count: 0, notifications: [] };
    }

    const notifications = [];
    for (const recId of recipientIds) {
      for (const ch of channels) {
        const notif = await this.createNotification({
          organizationId,
          recipientId: recId,
          type,
          channel: ch,
          priority,
          title,
          message,
          data,
          idempotencyKey: data.assignmentId ? `${type}:${data.assignmentId}:${recId}:${ch}` : null,
        });
        if (notif) notifications.push(notif);
      }
    }

    return { count: notifications.length, notifications };
  }

  /**
   * Multi-channel domain event notifier
   */
  static async notify({
    organizationId = null,
    recipientId,
    type,
    data = {},
    channels = null,
    priority = NOTIFICATION_PRIORITIES.NORMAL,
    immediate = false,
  }) {
    const template = NOTIFICATION_TEMPLATES[type];
    const targetChannels = channels || template?.channels || [NOTIFICATION_CHANNELS.IN_APP];

    const results = [];
    for (const ch of targetChannels) {
      const notif = await this.createNotification({
        organizationId,
        recipientId,
        type,
        channel: ch,
        priority,
        data,
        immediate,
        idempotencyKey: data.assignmentId ? `${type}:${data.assignmentId}:${ch}` : null,
      });
      if (notif) results.push(notif);
    }
    return results;
  }

  /**
   * Retrieves paginated in-app notifications for authenticated user
   */
  static async getUserNotifications(userId, organizationId = null, query = {}) {
    const filter = {
      recipientId: userId,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      deletedAt: null,
    };

    if (organizationId) {
      filter.$or = [{ organizationId }, { organizationId: null }];
    }

    if (query.unreadOnly === "true" || query.read === "false") {
      filter.readAt = null;
    }

    if (query.type) {
      filter.type = query.type;
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipientId: userId,
        channel: NOTIFICATION_CHANNELS.IN_APP,
        readAt: null,
        deletedAt: null,
        ...(organizationId ? { $or: [{ organizationId }, { organizationId: null }] } : {}),
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      unreadCount,
    };
  }

  /**
   * Retrieves unread count for UI badges
   */
  static async getUnreadCount(userId, organizationId = null) {
    const filter = {
      recipientId: userId,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      readAt: null,
      deletedAt: null,
    };

    if (organizationId) {
      filter.$or = [{ organizationId }, { organizationId: null }];
    }

    const count = await Notification.countDocuments(filter);
    return { count };
  }

  /**
   * Marks single notification as read
   */
  static async markAsRead(userId, notificationId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(400, "Invalid notification ID format");
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: userId,
        deletedAt: null,
      },
      {
        $set: {
          readAt: new Date(),
          status: NOTIFICATION_STATUSES.READ,
        },
      },
      { returnDocument: "after" }
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found or access denied");
    }

    return notification;
  }

  /**
   * Marks all unread notifications as read
   */
  static async markAllAsRead(userId, organizationId = null) {
    const filter = {
      recipientId: userId,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      readAt: null,
      deletedAt: null,
    };

    if (organizationId) {
      filter.$or = [{ organizationId }, { organizationId: null }];
    }

    const result = await Notification.updateMany(filter, {
      $set: {
        readAt: new Date(),
        status: NOTIFICATION_STATUSES.READ,
      },
    });

    return {
      updatedCount: result.modifiedCount,
    };
  }

  /**
   * Soft deletes a notification record
   */
  static async softDeleteNotification(userId, notificationId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(400, "Invalid notification ID format");
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: userId,
      },
      {
        $set: { deletedAt: new Date() },
      },
      { returnDocument: "after" }
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found or access denied");
    }

    return { success: true };
  }
}
