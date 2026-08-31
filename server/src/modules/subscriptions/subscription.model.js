import mongoose from "mongoose";
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_LIST,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LIST,
  PLAN_CONFIGURATIONS,
} from "../../constants/subscriptionPlans.js";

const subscriptionLimitsSchema = new mongoose.Schema(
  {
    candidates: { type: Number, default: 25 },
    assessments: { type: Number, default: 5 },
    questions: { type: Number, default: 50 },
    activeAssessments: { type: Number, default: 2 },
    staffUsers: { type: Number, default: 3 },
    interviews: { type: Number, default: 5 },
    monthlyAttempts: { type: Number, default: 50 },
    storageGb: { type: Number, default: 1 },
    maxUsers: { type: Number, default: 5 },
    maxCandidates: { type: Number, default: 200 },
    maxAssessments: { type: Number, default: 15 },
    maxQuestions: { type: Number, default: 500 },
    maxAttempts: { type: Number, default: 500 },
    maxInterviews: { type: Number, default: 20 },
    maxStorage: { type: Number, default: 10 },
  },
  { strict: false, _id: false }
);

const subscriptionFeaturesSchema = new mongoose.Schema(
  {
    assessmentBuilder: { type: Boolean, default: true },
    advancedQuestionBank: { type: Boolean, default: false },
    proctoring: { type: Boolean, default: false },
    liveInterviews: { type: Boolean, default: true },
    analytics: { type: Boolean, default: false },
    certificates: { type: Boolean, default: false },
    customCertificates: { type: Boolean, default: false },
    customBranding: { type: Boolean, default: false },
    exports: { type: Boolean, default: true },
    apiAccess: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    whiteLabeling: { type: Boolean, default: false },
  },
  { strict: false, _id: false }
);

const subscriptionUsageSchema = new mongoose.Schema(
  {
    candidatesUsed: { type: Number, default: 0 },
    assessmentsUsed: { type: Number, default: 0 },
    interviewsUsed: { type: Number, default: 0 },
    attemptsUsed: { type: Number, default: 0 },
    staffUsersUsed: { type: Number, default: 0 },
    storageBytesUsed: { type: Number, default: 0 },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      unique: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
      index: true,
    },
    planCode: {
      type: String,
      default: "FREE",
      uppercase: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      default: "FREE_TRIAL",
      index: true,
    },
    status: {
      type: String,
      default: "TRIALING",
      index: true,
    },
    billingInterval: {
      type: String,
      enum: ["MONTHLY", "YEARLY"],
      default: "MONTHLY",
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default trial
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    limits: {
      type: subscriptionLimitsSchema,
      default: () => PLAN_CONFIGURATIONS[SUBSCRIPTION_PLANS.FREE_TRIAL].limits,
    },
    features: {
      type: subscriptionFeaturesSchema,
      default: () => PLAN_CONFIGURATIONS[SUBSCRIPTION_PLANS.FREE_TRIAL].features,
    },
    usage: {
      type: subscriptionUsageSchema,
      default: () => ({}),
    },
    provider: {
      type: String,
      enum: ["STRIPE", "MOCK", "MANUAL"],
      default: "MOCK",
    },
    providerCustomerId: {
      type: String,
      default: null,
      trim: true,
    },
    providerSubscriptionId: {
      type: String,
      default: null,
      trim: true,
    },
    processedWebhookEvents: {
      type: [String],
      default: [],
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

subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
