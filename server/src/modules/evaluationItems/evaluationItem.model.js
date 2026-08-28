import mongoose from "mongoose";

const evaluationItemSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evaluation",
      required: [true, "Evaluation ID is required"],
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: [true, "Attempt ID is required"],
    },
    attemptQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttemptQuestion",
      required: [true, "Attempt Question ID is required"],
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question ID is required"],
    },
    points: {
      type: Number,
      required: true,
      default: 1,
    },
    earnedPoints: {
      type: Number,
      default: 0,
    },
    scorePercentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "EVALUATED", "NEEDS_MANUAL_REVIEW"],
      default: "PENDING",
      index: true,
    },
    evaluationType: {
      type: String,
      enum: ["AUTOMATIC", "MANUAL", "HYBRID", "AI_ASSISTED"],
      default: "AUTOMATIC",
    },
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
    evaluatedAt: {
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

evaluationItemSchema.index({ evaluationId: 1, attemptQuestionId: 1 }, { unique: true });
evaluationItemSchema.index({ attemptId: 1 });

const EvaluationItem =
  mongoose.models.EvaluationItem ||
  mongoose.model("EvaluationItem", evaluationItemSchema);

export default EvaluationItem;
