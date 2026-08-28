import mongoose from "mongoose";
import { RESULT_STATUSES, RESULT_STATUS_LIST } from "../../constants/resultStatuses.js";

const resultSchema = new mongoose.Schema(
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
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evaluation",
      required: [true, "Evaluation ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: RESULT_STATUS_LIST,
      default: RESULT_STATUSES.COMPLETED,
      index: true,
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
    grade: {
      type: String,
      default: "",
    },
    passed: {
      type: Boolean,
      default: false,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
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

resultSchema.index({ organizationId: 1, candidateId: 1 });
resultSchema.index({ organizationId: 1, assessmentId: 1 });

const Result =
  mongoose.models.Result || mongoose.model("Result", resultSchema);

export default Result;
