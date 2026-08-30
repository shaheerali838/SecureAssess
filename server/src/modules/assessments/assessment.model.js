import mongoose from "mongoose";
import {
  ASSESSMENT_TYPES,
  ASSESSMENT_TYPE_LIST,
  ASSESSMENT_STATUSES,
  ASSESSMENT_STATUS_LIST,
  SCHEDULING_MODES,
  PROCTORING_MODES,
  GRADING_METHODS,
  RESULT_VISIBILITY,
} from "./assessment.constants.js";

const securitySettingsSchema = new mongoose.Schema(
  {
    proctoringEnabled: { type: Boolean, default: true },
    proctoringMode: {
      type: String,
      enum: Object.values(PROCTORING_MODES),
      default: PROCTORING_MODES.AI_ASSISTED,
    },
    fullscreenRequired: { type: Boolean, default: true },
    tabSwitchDetection: { type: Boolean, default: true },
    copyPasteBlocked: { type: Boolean, default: true },
    rightClickBlocked: { type: Boolean, default: true },
    multipleMonitorDetection: { type: Boolean, default: false },
    cameraRequired: { type: Boolean, default: true },
    microphoneRequired: { type: Boolean, default: true },
    screenShareRequired: { type: Boolean, default: false },
  },
  { _id: false }
);

const gradingSettingsSchema = new mongoose.Schema(
  {
    passingScore: { type: Number, default: 60, min: 0, max: 100 },
    gradingMethod: {
      type: String,
      enum: Object.values(GRADING_METHODS),
      default: GRADING_METHODS.AUTOMATIC,
    },
    negativeMarking: { type: Boolean, default: false },
    multipleChoiceGradingPolicy: { type: String, default: "EXACT_MATCH" },
    roundScore: { type: Number, default: 2 },
  },
  { _id: false }
);

const attemptSettingsSchema = new mongoose.Schema(
  {
    maxAttempts: { type: Number, default: 1, min: 1 },
    allowResume: { type: Boolean, default: true },
    allowLateSubmission: { type: Boolean, default: false },
    autoSubmitOnTimeout: { type: Boolean, default: true },
    showResultImmediately: { type: Boolean, default: false },
  },
  { _id: false }
);

const reviewSettingsSchema = new mongoose.Schema(
  {
    allowReview: { type: Boolean, default: true },
    allowFlagging: { type: Boolean, default: true },
    showAnsweredStatus: { type: Boolean, default: true },
  },
  { _id: false }
);

const resultSettingsSchema = new mongoose.Schema(
  {
    visibility: {
      type: String,
      enum: Object.values(RESULT_VISIBILITY),
      default: RESULT_VISIBILITY.AFTER_REVIEW,
    },
    scheduledPublishAt: { type: Date, default: null },
  },
  { _id: false }
);

const navigationSettingsSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["ALLOW_BACKWARD_NAVIGATION", "FORWARD_ONLY"],
      default: "ALLOW_BACKWARD_NAVIGATION",
    },
  },
  { _id: false }
);

const schedulingSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: Object.values(SCHEDULING_MODES),
      default: SCHEDULING_MODES.WINDOW,
    },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    timezone: { type: String, default: "UTC" },
  },
  { _id: false }
);

const durationSchema = new mongoose.Schema(
  {
    value: { type: Number, default: 60, min: 1 },
    unit: { type: String, enum: ["MINUTES", "SECONDS", "HOURS"], default: "MINUTES" },
  },
  { _id: false }
);

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
      default: "Read each question carefully and submit before the timer expires.",
    },
    duration: {
      type: durationSchema,
      default: () => ({ value: 60, unit: "MINUTES" }),
    },
    durationSeconds: {
      type: Number,
      default: 3600,
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
    scheduling: {
      type: schedulingSchema,
      default: () => ({ mode: SCHEDULING_MODES.WINDOW, timezone: "UTC" }),
    },
    settings: {
      shuffleQuestions: { type: Boolean, default: true },
      shuffleOptions: { type: Boolean, default: true },
      allowBackNavigation: { type: Boolean, default: true },
      showResultImmediately: { type: Boolean, default: false },
      allowResume: { type: Boolean, default: true },
      maxAttempts: { type: Number, default: 1, min: 1 },
      preventCopyPaste: { type: Boolean, default: true },
      fullscreenRequired: { type: Boolean, default: true },
      calculatorAllowed: { type: Boolean, default: false },
      showQuestionNumbers: { type: Boolean, default: true },
    },
    securitySettings: {
      type: securitySettingsSchema,
      default: () => ({}),
    },
    gradingSettings: {
      type: gradingSettingsSchema,
      default: () => ({}),
    },
    attemptSettings: {
      type: attemptSettingsSchema,
      default: () => ({}),
    },
    reviewSettings: {
      type: reviewSettingsSchema,
      default: () => ({}),
    },
    resultSettings: {
      type: resultSettingsSchema,
      default: () => ({}),
    },
    navigation: {
      type: navigationSettingsSchema,
      default: () => ({ mode: "ALLOW_BACKWARD_NAVIGATION" }),
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
    archivedAt: {
      type: Date,
      default: null,
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

assessmentSchema.pre("save", async function () {
  if (this.duration && this.duration.value) {
    if (this.duration.unit === "MINUTES") {
      this.durationSeconds = this.duration.value * 60;
    } else if (this.duration.unit === "HOURS") {
      this.durationSeconds = this.duration.value * 3600;
    } else {
      this.durationSeconds = this.duration.value;
    }
  }
  if (this.gradingSettings && this.gradingSettings.passingScore !== undefined) {
    this.passingScore = this.gradingSettings.passingScore;
  }
});

// Indexes
assessmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });
assessmentSchema.index({ organizationId: 1, status: 1 });
assessmentSchema.index({ organizationId: 1, subjectId: 1 });

const Assessment =
  mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);

export default Assessment;
