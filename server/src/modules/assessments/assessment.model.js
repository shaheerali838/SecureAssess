import mongoose from "mongoose";
import { ASSESSMENT_STATUS, ASSESSMENT_DEFAULTS } from "./assessment.constants.js";
import { ASSESSMENT_TYPES, ASSESSMENT_TYPE_LIST } from "../../constants/assessmentTypes.js";

const assessmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Assessment title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ASSESSMENT_TYPE_LIST,
      default: ASSESSMENT_TYPES.MCQ,
    },
    status: {
      type: String,
      enum: Object.values(ASSESSMENT_STATUS),
      default: ASSESSMENT_STATUS.DRAFT,
    },
    durationMinutes: {
      type: Number,
      default: ASSESSMENT_DEFAULTS.DEFAULT_DURATION_MINUTES,
      min: 1,
    },
    passingPercentage: {
      type: Number,
      default: ASSESSMENT_DEFAULTS.DEFAULT_PASSING_PERCENTAGE,
      min: 0,
      max: 100,
    },
    accessCode: {
      type: String,
      sparse: true,
      trim: true,
    },
    proctoringSettings: {
      enforceFullscreen: { type: Boolean, default: ASSESSMENT_DEFAULTS.ENFORCE_FULLSCREEN },
      trackTabSwitches: { type: Boolean, default: true },
      maxTabSwitchesAllowed: { type: Number, default: ASSESSMENT_DEFAULTS.FLAG_TAB_SWITCH_LIMIT },
      enableWebcamMonitoring: { type: Boolean, default: true },
      enableAudioDetection: { type: Boolean, default: false },
    },
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ organizationId: 1, status: 1 });
assessmentSchema.index({ organizationId: 1, createdAt: -1 });

const Assessment =
  mongoose.models.Assessment || mongoose.model("Assessment", assessmentSchema);

export default Assessment;
