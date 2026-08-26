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
    },
    slug: {
      type: String,
      required: [true, "Organization slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, "Organization code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ORGANIZATION_TYPES),
      default: ORGANIZATION_TYPES.CORPORATE,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    logo: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      addressLine1: { type: String, trim: true, default: "" },
      addressLine2: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
      postalCode: { type: String, trim: true, default: "" },
    },
    status: {
      type: String,
      enum: Object.values(ORGANIZATION_STATUSES),
      default: ORGANIZATION_STATUSES.ACTIVE,
      index: true,
    },
    settings: {
      timezone: {
        type: String,
        default: ORGANIZATION_DEFAULTS.TIMEZONE,
      },
      locale: {
        type: String,
        default: ORGANIZATION_DEFAULTS.LOCALE,
      },
      dateFormat: {
        type: String,
        default: ORGANIZATION_DEFAULTS.DATE_FORMAT,
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
      assessmentDefaults: {
        durationMinutes: {
          type: Number,
          default: ORGANIZATION_DEFAULTS.ASSESSMENT_DEFAULTS.durationMinutes,
        },
        passingPercentage: {
          type: Number,
          default: ORGANIZATION_DEFAULTS.ASSESSMENT_DEFAULTS.passingPercentage,
        },
        enforceFullscreen: {
          type: Boolean,
          default: ORGANIZATION_DEFAULTS.ASSESSMENT_DEFAULTS.enforceFullscreen,
        },
        trackTabSwitches: {
          type: Boolean,
          default: ORGANIZATION_DEFAULTS.ASSESSMENT_DEFAULTS.trackTabSwitches,
        },
        maxTabSwitchesAllowed: {
          type: Number,
          default: ORGANIZATION_DEFAULTS.ASSESSMENT_DEFAULTS.maxTabSwitchesAllowed,
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
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
organizationSchema.index({ status: 1, createdAt: -1 });

const Organization =
  mongoose.models.Organization ||
  mongoose.model("Organization", organizationSchema);

export default Organization;
