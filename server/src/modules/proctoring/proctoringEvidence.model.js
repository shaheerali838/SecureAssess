import mongoose from "mongoose";

const proctoringEvidenceSchema = new mongoose.Schema(
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
      required: [true, "Proctoring session ID is required"],
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
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProctoringEvent",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["SCREENSHOT", "WEBCAM_SNAPSHOT", "AUDIO_CLIP", "VIDEO_CLIP", "SCREEN_RECORDING", "AI_ANALYSIS_METADATA"],
      required: [true, "Evidence type is required"],
      index: true,
    },
    storageKey: {
      type: String,
      required: [true, "Storage key / path is required"],
      trim: true,
    },
    mimeType: {
      type: String,
      default: "image/jpeg",
      trim: true,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default retention
      index: true,
    },
    checksum: {
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

proctoringEvidenceSchema.index({ organizationId: 1, proctoringSessionId: 1 });
proctoringEvidenceSchema.index({ organizationId: 1, candidateId: 1 });

const ProctoringEvidence =
  mongoose.models.ProctoringEvidence ||
  mongoose.model("ProctoringEvidence", proctoringEvidenceSchema);

export default ProctoringEvidence;
