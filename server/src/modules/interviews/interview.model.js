import mongoose from "mongoose";
import {
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LIST,
  INTERVIEW_STATUSES,
  INTERVIEW_STATUS_LIST,
} from "./interview.constants.js";

const interviewSettingsSchema = new mongoose.Schema(
  {
    maxParticipants: { type: Number, default: 5 },
    waitingRoomEnabled: { type: Boolean, default: true },
    candidateCameraRequired: { type: Boolean, default: true },
    candidateMicrophoneRequired: { type: Boolean, default: true },
    screenSharingEnabled: { type: Boolean, default: true },
    recordingEnabled: { type: Boolean, default: true },
    chatEnabled: { type: Boolean, default: true },
    fileSharingEnabled: { type: Boolean, default: false },
    transcriptionEnabled: { type: Boolean, default: false },
    autoEndAfterMinutes: { type: Number, default: 60 },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Interview title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: INTERVIEW_TYPE_LIST,
      default: INTERVIEW_TYPES.TECHNICAL,
      index: true,
    },
    status: {
      type: String,
      enum: INTERVIEW_STATUS_LIST,
      default: INTERVIEW_STATUSES.SCHEDULED,
      index: true,
    },
    scheduledStartAt: {
      type: Date,
      required: [true, "Scheduled start date/time is required"],
      index: true,
    },
    scheduledEndAt: {
      type: Date,
      required: [true, "Scheduled end date/time is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user ID is required"],
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      default: null,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    settings: {
      type: interviewSettingsSchema,
      default: () => ({}),
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

interviewSchema.index({ organizationId: 1, candidateId: 1 });
interviewSchema.index({ organizationId: 1, scheduledStartAt: 1 });
interviewSchema.index({ organizationId: 1, status: 1 });

const Interview =
  mongoose.models.Interview || mongoose.model("Interview", interviewSchema);

export default Interview;
