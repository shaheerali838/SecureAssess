import mongoose from "mongoose";
import {
  SESSION_STATUSES,
  SESSION_STATUS_LIST,
} from "./interview.constants.js";

const interviewSessionSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: [true, "Interview ID is required"],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, "Live session ID is required"],
      unique: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: SESSION_STATUS_LIST,
      default: SESSION_STATUSES.INITIALIZING,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Host user ID is required"],
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    recordingStatus: {
      type: String,
      enum: ["NOT_RECORDED", "RECORDING", "COMPLETED", "FAILED"],
      default: "NOT_RECORDED",
    },
    recordingUrl: {
      type: String,
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

interviewSessionSchema.index({ interviewId: 1, createdAt: -1 });

const InterviewSession =
  mongoose.models.InterviewSession ||
  mongoose.model("InterviewSession", interviewSessionSchema);

export default InterviewSession;
