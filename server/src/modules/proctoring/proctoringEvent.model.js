import mongoose from "mongoose";
import {
  PROCTORING_EVENT_TYPES,
  PROCTORING_EVENT_TYPE_LIST,
  EVENT_SEVERITIES,
  EVENT_SEVERITY_LIST,
} from "../../constants/proctoringConstants.js";

const proctoringEventSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    proctoringSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProctoringSession",
      required: [true, "Proctoring Session ID is required"],
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: [true, "Attempt ID is required"],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    evidenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProctoringEvidence",
      default: null,
      index: true,
    },
    clientEventId: {
      type: String,
      default: null,
      trim: true,
    },
    type: {
      type: String,
      enum: PROCTORING_EVENT_TYPE_LIST,
      required: [true, "Event type is required"],
      index: true,
    },
    severity: {
      type: String,
      enum: EVENT_SEVERITY_LIST,
      default: EVENT_SEVERITIES.INFO,
      index: true,
    },
    riskPoints: {
      type: Number,
      default: 0,
    },
    clientOccurredAt: {
      type: Date,
      default: null,
    },
    serverOccurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    confidence: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1.0,
    },
    source: {
      type: String,
      enum: ["BROWSER", "WEBRTC", "AI_AGENT", "PROCTOR", "SYSTEM"],
      default: "BROWSER",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reviewed: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewerNote: {
      type: String,
      default: "",
    },
    resolution: {
      type: String,
      enum: ["UNRESOLVED", "CONFIRMED_VIOLATION", "DISMISSED", "FALSE_POSITIVE"],
      default: "UNRESOLVED",
    },
  },
  {
    timestamps: true,
  }
);

proctoringEventSchema.index(
  { proctoringSessionId: 1, clientEventId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientEventId: { $type: "string" } },
  }
);
proctoringEventSchema.index({ proctoringSessionId: 1, serverOccurredAt: 1 });
proctoringEventSchema.index({ organizationId: 1, serverOccurredAt: -1 });

const ProctoringEvent =
  mongoose.models.ProctoringEvent ||
  mongoose.model("ProctoringEvent", proctoringEventSchema);

export default ProctoringEvent;
