import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
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
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: [true, "Assessment ID is required"],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    evaluationType: {
      type: String,
      enum: ["AUTOMATIC", "MANUAL", "HYBRID", "AI_ASSISTED"],
      default: "AUTOMATIC",
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    evaluatedQuestions: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    earnedPoints: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    version: {
      type: Number,
      default: 1,
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

evaluationSchema.index({ organizationId: 1, attemptId: 1 });
evaluationSchema.index({ attemptId: 1, version: -1 });

const Evaluation =
  mongoose.models.Evaluation || mongoose.model("Evaluation", evaluationSchema);

export default Evaluation;
