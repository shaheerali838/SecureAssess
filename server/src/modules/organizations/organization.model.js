import mongoose from "mongoose";
import {
  ORGANIZATION_TYPES,
  ORGANIZATION_STATUSES,
  ORGANIZATION_DEFAULTS,
} from "./organization.constants.js";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: [true, "Organization slug is required"],
      lowercase: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Organization code is required"],
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(ORGANIZATION_TYPES),
      default: ORGANIZATION_TYPES.CORPORATE,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    logo: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    address: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
      postalCode: { type: String, trim: true, default: "" },
    },
    contact: {
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
    },
    status: {
      type: String,
      enum: Object.values(ORGANIZATION_STATUSES),
      default: ORGANIZATION_STATUSES.TRIAL,
    },
    settings: {
      timezone: {
        type: String,
        default: ORGANIZATION_DEFAULTS.TIMEZONE,
      },
      defaultLanguage: {
        type: String,
        default: ORGANIZATION_DEFAULTS.LOCALE,
      },
      branding: {
        primaryColor: {
          type: String,
          default: ORGANIZATION_DEFAULTS.BRANDING.primaryColor,
        },
        secondaryColor: {
          type: String,
          default: ORGANIZATION_DEFAULTS.BRANDING.secondaryColor,
        },
      },
      assessmentSettings: {
        allowCandidatePause: {
          type: Boolean,
          default: false,
        },
        defaultDurationMinutes: {
          type: Number,
          default: 60,
        },
      },
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ code: 1 }, { unique: true });
organizationSchema.index({ status: 1 });
organizationSchema.index({ type: 1 });
organizationSchema.index({ name: "text", description: "text" });

const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);

export default Organization;
