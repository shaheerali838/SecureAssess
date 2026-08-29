import mongoose from "mongoose";
import { QUESTION_TYPE_LIST, QUESTION_TYPES } from "../../constants/questionTypes.js";

const assessmentQuestionOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const assessmentQuestionSchema = new mongoose.Schema(
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
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssessmentSection",
      required: [true, "Section ID is required"],
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: [true, "Original Question ID is required"],
      index: true,
    },
    questionVersion: {
      type: Number,
      default: 1,
    },
    order: {
      type: Number,
      default: 1,
    },
    marks: {
      type: Number,
      default: 1,
      min: 0,
    },
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: QUESTION_TYPE_LIST,
      default: QUESTION_TYPES.SINGLE_CHOICE,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    prompt: {
      type: String,
      required: [true, "Prompt snapshot is required"],
    },
    options: {
      type: [assessmentQuestionOptionSchema],
      default: [],
    },
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    explanation: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      default: "MEDIUM",
    },
    snapshotVersion: {
      type: Number,
      default: 1,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

assessmentQuestionSchema.index({ assessmentId: 1, sectionId: 1, order: 1 });

const AssessmentQuestion =
  mongoose.models.AssessmentQuestion ||
  mongoose.model("AssessmentQuestion", assessmentQuestionSchema);

export default AssessmentQuestion;
