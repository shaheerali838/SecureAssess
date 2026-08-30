import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
      index: true,
    },
    email: {
      enabled: { type: Boolean, default: true },
      assessmentAssigned: { type: Boolean, default: true },
      resultPublished: { type: Boolean, default: true },
      certificateIssued: { type: Boolean, default: true },
      interviewReminder: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true, immutable: false },
      assessment: { type: Boolean, default: true },
      results: { type: Boolean, default: true },
      interviews: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
    },
    inApp: {
      enabled: { type: Boolean, default: true },
      assessmentAssigned: { type: Boolean, default: true },
      resultPublished: { type: Boolean, default: true },
      certificateIssued: { type: Boolean, default: true },
      interviewReminder: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
    },
    push: {
      enabled: { type: Boolean, default: false },
    },
    sms: {
      enabled: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model("NotificationPreference", notificationPreferenceSchema);

export default NotificationPreference;
