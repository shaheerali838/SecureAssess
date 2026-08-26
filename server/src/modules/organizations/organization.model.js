import mongoose from "mongoose";
import {
  ORGANIZATION_TYPES,
  ORGANIZATION_STATUS,
  ORGANIZATION_DEFAULTS,
} from "./organization.constants.js";
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_LIST,
} from "../../constants/subscriptionPlans.js";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ORGANIZATION_TYPES),
      default: ORGANIZATION_TYPES.COMPANY,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    logoUrl: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: SUBSCRIPTION_PLAN_LIST,
        default: SUBSCRIPTION_PLANS.FREE_TRIAL,
      },
      status: {
        type: String,
        enum: ["ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"],
        default: "ACTIVE",
      },
      validUntil: {
        type: Date,
      },
      maxUsers: {
        type: Number,
        default: ORGANIZATION_DEFAULTS.MAX_USERS,
      },
      maxAssessmentsPerMonth: {
        type: Number,
        default: ORGANIZATION_DEFAULTS.MAX_ASSESSMENTS_PER_MONTH,
      },
    },
    settings: {
      allowedDomains: [{ type: String }],
      enforceProctoring: {
        type: Boolean,
        default: ORGANIZATION_DEFAULTS.DEFAULT_PROCTORING.enforceFullscreen,
      },
      enableWebcamSnapshot: {
        type: Boolean,
        default: ORGANIZATION_DEFAULTS.DEFAULT_PROCTORING.enableWebcamSnapshot,
      },
      enableScreenShare: {
        type: Boolean,
        default: ORGANIZATION_DEFAULTS.DEFAULT_PROCTORING.enableScreenShare,
      },
    },
    status: {
      type: String,
      enum: Object.values(ORGANIZATION_STATUS),
      default: ORGANIZATION_STATUS.ACTIVE,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.index({ status: 1, isActive: 1 });

const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);

export default Organization;
