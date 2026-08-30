import mongoose from "mongoose";
import {
  PROCTORING_STATUSES,
  PROCTORING_STATUS_LIST,
  INTEGRITY_STATUSES,
  INTEGRITY_STATUS_LIST,
  RISK_LEVELS,
  RISK_LEVEL_LIST,
} from "../../constants/proctoringConstants.js";

const proctoringSessionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: [true, "Attempt ID is required"],
      unique: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: [true, "Assessment ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: PROCTORING_STATUS_LIST,
      default: PROCTORING_STATUSES.NOT_STARTED,
      index: true,
    },
    integrityStatus: {
      type: String,
      enum: INTEGRITY_STATUS_LIST,
      default: INTEGRITY_STATUSES.CLEAR,
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    lastHeartbeatAt: {
      type: Date,
      default: null,
    },
    cameraEnabled: {
      type: Boolean,
      default: false,
    },
    microphoneEnabled: {
      type: Boolean,
      default: false,
    },
    screenShareEnabled: {
      type: Boolean,
      default: false,
    },
    browserInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    deviceInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: RISK_LEVEL_LIST,
      default: RISK_LEVELS.LOW,
      index: true,
    },
    violationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    terminatedReason: {
      type: String,
      default: null,
      trim: true,
    },
    warningsSent: [
      {
        message: { type: String, required: true },
        sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        sentAt: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

proctoringSessionSchema.index({ organizationId: 1, status: 1 });
proctoringSessionSchema.index({ organizationId: 1, candidateId: 1 });
proctoringSessionSchema.index({ organizationId: 1, integrityStatus: 1 });

const ProctoringSession =
  mongoose.models.ProctoringSession ||
  mongoose.model("ProctoringSession", proctoringSessionSchema);

export default ProctoringSession;
