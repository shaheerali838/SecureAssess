import mongoose from "mongoose";
import { ASSESSMENT_TYPES, ASSESSMENT_TYPE_LIST } from "../../constants/assessmentTypes.js";
import { ASSESSMENT_STATUSES, ASSESSMENT_STATUS_LIST } from "../../constants/assessmentStatuses.js";

const assessmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Assessment title is required"],
      trim: true,
      maxlength: 200,
    },
    code: {
      type: String,
      required: [true, "Assessment code is required"],
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    type: {
      type: String,
      enum: ASSESSMENT_TYPE_LIST,
      default: ASSESSMENT_TYPES.MCQ,
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
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
    status: {
      type: String,
      enum: ASSESSMENT_STATUS_LIST,
      default: ASSESSMENT_STATUSES.DRAFT,
      index: true,
    },
    instructions: {
      type: String,
      default: "",
    },
    durationSeconds: {
      type: Number,
      required: [true, "Duration in seconds is required"],
      default: 3600,
      min: 60,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    passingScore: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    settings: {
      shuffleQuestions: { type: Boolean, default: true },
      shuffleOptions: { type: Boolean, default: true },
      allowBackNavigation: { type: Boolean, default: true },
      showResultImmediately: { type: Boolean, default: false },
      allowResume: { type: Boolean, default: false },
      maxAttempts: { type: Number, default: 1, min: 1 },
      preventCopyPaste: { type: Boolean, default: true },
      fullscreenRequired: { type: Boolean, default: true },
      calculatorAllowed: { type: Boolean, default: false },
      showQuestionNumbers: { type: Boolean, default: true },
    },
    scheduling: {
      startAt: { type: Date, default: null },
      endAt: { type: Date, default: null },
      timezone: { type: String, default: "Asia/Karachi" },
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
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
assessmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });
assessmentSchema.index({ organizationId: 1, status: 1 });
assessmentSchema.index({ organizationId: 1, subjectId: 1 });

const Assessment =
  mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);

export default Assessment;
