import mongoose from "mongoose";
import {
  BILLING_INTERVAL_LIST,
  PLAN_STATUS_LIST,
  PLAN_STATUSES,
} from "./subscription.constants.js";

const planLimitsSchema = new mongoose.Schema(
  {
    maxUsers: { type: Number, default: 5 },
    maxCandidates: { type: Number, default: 200 },
    maxAssessments: { type: Number, default: 15 },
    maxQuestions: { type: Number, default: 500 },
    maxAttempts: { type: Number, default: 500 },
    maxInterviews: { type: Number, default: 20 },
    maxStorage: { type: Number, default: 10 }, // in GB
    maxOrganizations: { type: Number, default: 1 },
  },
  { _id: false }
);

const planFeaturesSchema = new mongoose.Schema(
  {
    assessmentBuilder: { type: Boolean, default: true },
    advancedQuestionBank: { type: Boolean, default: false },
    proctoring: { type: Boolean, default: false },
    liveInterviews: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    certificates: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    exports: { type: Boolean, default: true },
    apiAccess: { type: Boolean, default: false },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Plan code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    billingInterval: {
      type: String,
      enum: BILLING_INTERVAL_LIST,
      default: "MONTHLY",
    },
    limits: {
      type: planLimitsSchema,
      default: () => ({}),
    },
    features: {
      type: planFeaturesSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: PLAN_STATUS_LIST,
      default: PLAN_STATUSES.ACTIVE,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
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

planSchema.index({ status: 1, isPublic: 1, sortOrder: 1 });

const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default Plan;
