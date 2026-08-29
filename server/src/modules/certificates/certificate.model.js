import mongoose from "mongoose";
import {
  CERTIFICATE_STATUSES,
  CERTIFICATE_STATUS_LIST,
  CERTIFICATE_TYPES,
  CERTIFICATE_TYPE_LIST,
  CERTIFICATE_TEMPLATES,
  CERTIFICATE_TEMPLATE_LIST,
} from "./certificate.constants.js";

const certificateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    certificateNumber: {
      type: String,
      required: [true, "Certificate number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    verificationCode: {
      type: String,
      required: [true, "Verification code is required"],
      unique: true,
      trim: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: [true, "Assessment ID is required"],
      index: true,
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
      required: [true, "Attempt ID is required"],
      index: true,
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Result",
      required: [true, "Result ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: CERTIFICATE_TYPE_LIST,
      default: CERTIFICATE_TYPES.ASSESSMENT,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Certificate title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    recipientName: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: CERTIFICATE_STATUS_LIST,
      default: CERTIFICATE_STATUSES.ISSUED,
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: "",
    },
    issuerName: {
      type: String,
      default: "SecureAssess",
      trim: true,
    },
    issuerTitle: {
      type: String,
      default: "Authorized Examination Authority",
      trim: true,
    },
    templateId: {
      type: String,
      enum: CERTIFICATE_TEMPLATE_LIST,
      default: CERTIFICATE_TEMPLATES.MODERN,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    verificationUrl: {
      type: String,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    revocationReason: {
      type: String,
      default: null,
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

certificateSchema.index({ organizationId: 1, candidateId: 1 });
certificateSchema.index({ organizationId: 1, assessmentId: 1 });
certificateSchema.index({ verificationCode: 1, status: 1 });

const Certificate =
  mongoose.models.Certificate ||
  mongoose.model("Certificate", certificateSchema);

export default Certificate;
