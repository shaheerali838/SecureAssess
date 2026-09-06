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

const codingConfigSchema = new mongoose.Schema(
  {
    languages: {
      type: [String],
      default: ["javascript", "python", "java", "cpp"],
    },
    starterCode: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timeLimit: {
      type: Number,
      default: 2000, // ms
    },
    memoryLimit: {
      type: Number,
      default: 256, // MB
    },
    testCases: [
      {
        input: { type: String, default: "" },
        expectedOutput: { type: String, default: "" },
        isHidden: { type: Boolean, default: false },
        points: { type: Number, default: 1 },
      },
    ],
  },
  { _id: false }
);

const fileUploadConfigSchema = new mongoose.Schema(
  {
    allowedExtensions: {
      type: [String],
      default: [".pdf", ".zip", ".docx"],
    },
    maxFileSize: {
      type: Number,
      default: 10485760, // 10MB in bytes
    },
    maxFiles: {
      type: Number,
      default: 1,
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
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
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
    description: {
      type: String,
      default: "",
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    options: {
      type: [questionOptionSchema],
      default: [],
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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
      enum: ["EASY", "MEDIUM", "HARD", "EXPERT"],
      default: "MEDIUM",
      index: true,
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
    estimatedTime: {
      type: Number,
      default: 60, // seconds
    },
    coding: {
      type: codingConfigSchema,
      default: null,
    },
    fileUpload: {
      type: fileUploadConfigSchema,
      default: null,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestionTag",
      },
    ],
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
questionSchema.index({ organizationId: 1, questionBankId: 1, status: 1 });
questionSchema.index({ organizationId: 1, type: 1, difficulty: 1 });
questionSchema.index({ organizationId: 1, tags: 1 });
questionSchema.index({ organizationId: 1, subjectId: 1 });

const Question =
  mongoose.models.Question || mongoose.model("Question", questionSchema);

export default Question;
