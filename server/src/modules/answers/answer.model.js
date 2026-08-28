import mongoose from "mongoose";
import { QUESTION_TYPE_LIST, QUESTION_TYPES } from "../../constants/questionTypes.js";

const structuredAnswerSchema = new mongoose.Schema(
  {
    selectedOptionId: {
      type: String,
      default: null,
      trim: true,
    },
    selectedOptionIds: {
      type: [String],
      default: [],
    },
    text: {
      type: String,
      default: "",
    },
    code: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
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
    attemptQuestionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttemptQuestion",
      required: [true, "Attempt Question ID is required"],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    answer: {
      type: structuredAnswerSchema,
      required: true,
      default: () => ({}),
    },
    answerType: {
      type: String,
      enum: QUESTION_TYPE_LIST,
      default: QUESTION_TYPES.SINGLE_CHOICE,
      required: true,
    },
    isAnswered: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
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

// Indexes
answerSchema.index({ attemptId: 1, attemptQuestionId: 1 }, { unique: true });
answerSchema.index({ organizationId: 1, candidateId: 1 });
answerSchema.index({ attemptId: 1, savedAt: -1 });

const Answer =
  mongoose.models.Answer || mongoose.model("Answer", answerSchema);

export default Answer;
