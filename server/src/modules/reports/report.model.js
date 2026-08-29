import mongoose from "mongoose";
import {
  REPORT_TYPES,
  REPORT_TYPE_LIST,
  REPORT_FORMATS,
  REPORT_FORMAT_LIST,
  REPORT_STATUSES,
  REPORT_STATUS_LIST,
} from "./report.constants.js";

const reportSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: REPORT_TYPE_LIST,
      required: [true, "Report type is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Report name is required"],
      trim: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Generator user ID is required"],
      index: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: REPORT_STATUS_LIST,
      default: REPORT_STATUSES.PENDING,
      index: true,
    },
    format: {
      type: String,
      enum: REPORT_FORMAT_LIST,
      default: REPORT_FORMATS.JSON,
      index: true,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
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

reportSchema.index({ organizationId: 1, type: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1, createdAt: -1 });

const Report =
  mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;
