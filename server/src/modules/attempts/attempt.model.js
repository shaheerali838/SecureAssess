import mongoose from "mongoose";
import { ATTEMPT_STATUSES, ATTEMPT_STATUS_LIST } from "../../constants/attemptStatuses.js";

const attemptSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: [true, "Assessment ID is required"],
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentAssignment",
      required: [true, "Assignment ID is required"],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ATTEMPT_STATUS_LIST,
      default: ATTEMPT_STATUSES.IN_PROGRESS,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    startedFromIp: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    answeredQuestions: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    terminationReason: {
      type: String,
      default: null,
      trim: true,
    },
    proctoringSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProctoringSession",
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

attemptSchema.index({ organizationId: 1, candidateId: 1, assessmentId: 1 });
attemptSchema.index({ assignmentId: 1, attemptNumber: 1 });
attemptSchema.index({ status: 1, expiresAt: 1 });

const Attempt =
  mongoose.models.Attempt || mongoose.model("Attempt", attemptSchema);

export default Attempt;
