import mongoose from "mongoose";
import {
  NOTIFICATION_TYPE_LIST,
  NOTIFICATION_CHANNEL_LIST,
} from "./notification.constants.js";

export const createNotificationSchema = {
  validate: (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
      return {
        error: { details: [{ message: "Request body is required" }] },
        value: body,
      };
    }
    if (!body.recipientId || !mongoose.Types.ObjectId.isValid(body.recipientId)) {
      errors.push({ message: "Valid recipientId is required" });
    }
    if (!body.type || !NOTIFICATION_TYPE_LIST.includes(body.type)) {
      errors.push({
        message: `type must be one of: ${NOTIFICATION_TYPE_LIST.join(", ")}`,
      });
    }
    if (body.channel && !NOTIFICATION_CHANNEL_LIST.includes(body.channel)) {
      errors.push({
        message: `channel must be one of: ${NOTIFICATION_CHANNEL_LIST.join(", ")}`,
      });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body,
    };
  },
};

export const updatePreferencesSchema = {
  validate: (body) => {
    const errors = [];
    if (!body || typeof body !== "object") {
      return {
        error: { details: [{ message: "Request body is required" }] },
        value: body,
      };
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: body,
    };
  },
};
