import mongoose from "mongoose";
import {
  NOTIFICATION_TYPE_LIST,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNEL_LIST,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITY_LIST,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUS_LIST,
  NOTIFICATION_STATUSES,
} from "./notification.constants.js";

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient user ID is required"],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPE_LIST,
      default: NOTIFICATION_TYPES.SYSTEM_ALERT,
      index: true,
    },
    channel: {
      type: String,
      enum: NOTIFICATION_CHANNEL_LIST,
      default: NOTIFICATION_CHANNELS.IN_APP,
      index: true,
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITY_LIST,
      default: NOTIFICATION_PRIORITIES.NORMAL,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    idempotencyKey: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: NOTIFICATION_STATUS_LIST,
      default: NOTIFICATION_STATUSES.PENDING,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, recipientId: 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
