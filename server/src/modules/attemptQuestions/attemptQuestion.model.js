import mongoose from "mongoose";
import { QUESTION_TYPE_LIST, QUESTION_TYPES } from "../../constants/questionTypes.js";

const attemptQuestionOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const attemptQuestionSchema = new mongoose.Schema(
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
    assessmentQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentQuestion",
      required: [true, "Assessment Question ID is required"],
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Question ID is required"],
    },
    order: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: QUESTION_TYPE_LIST,
      default: QUESTION_TYPES.SINGLE_CHOICE,
      required: true,
    },
    prompt: {
      type: String,
      required: [true, "Prompt is required"],
    },
    options: {
      type: [attemptQuestionOptionSchema],
      default: [],
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    status: {
      type: String,
      enum: ["NOT_VISITED", "VISITED", "ANSWERED", "FLAGGED_FOR_REVIEW"],
      default: "NOT_VISITED",
    },
    visitedAt: {
      type: Date,
      default: null,
    },
    answeredAt: {
      type: Date,
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

attemptQuestionSchema.index({ attemptId: 1, order: 1 });
attemptQuestionSchema.index({ attemptId: 1, assessmentQuestionId: 1 });

const AttemptQuestion =
  mongoose.models.AttemptQuestion ||
  mongoose.model("AttemptQuestion", attemptQuestionSchema);

export default AttemptQuestion;
