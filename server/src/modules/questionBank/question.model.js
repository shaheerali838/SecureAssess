import mongoose from "mongoose";
import { QUESTION_TYPE_LIST, QUESTION_TYPES } from "../../constants/questionTypes.js";

const questionOptionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    questionBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionBank",
      required: [true, "Question Bank ID is required"],
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionCategory",
      default: null,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: QUESTION_TYPE_LIST,
      default: QUESTION_TYPES.SINGLE_CHOICE,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    prompt: {
      type: String,
      required: [true, "Question prompt is required"],
      trim: true,
    },
    options: {
      type: [questionOptionSchema],
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
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
      index: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestionTag",
      },
    ],
    timeLimit: {
      type: Number,
      default: 0, // 0 = unlimited seconds
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
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

// Compound indexes
questionSchema.index({ questionBankId: 1, status: 1 });
questionSchema.index({ organizationId: 1, type: 1 });
questionSchema.index({ organizationId: 1, tags: 1 });

const Question =
  mongoose.models.Question || mongoose.model("Question", questionSchema);

export default Question;
