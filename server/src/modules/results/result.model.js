import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
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
      unique: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
      index: true,
    },
    evaluationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Evaluation",
      required: [true, "Evaluation ID is required"],
      index: true,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    obtainedMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CALCULATING",
        "PROCESSING",
        "READY",
        "PUBLISHED",
        "WITHHELD",
        "VOIDED",
        "CANCELLED",
      ],
      default: "READY",
      index: true,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    rank: {
      type: Number,
      default: null,
    },
    grade: {
      type: String,
      default: "",
    },
    sectionScores: [
      {
        sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentSection" },
        title: { type: String, default: "" },
        totalMarks: { type: Number, default: 0 },
        obtainedMarks: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],
    published: {
      type: Boolean,
      default: false,
      index: true,
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
    voidedAt: {
      type: Date,
      default: null,
    },
    voidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    voidReason: {
      type: String,
      default: "",
    },
    correctionHistory: [
      {
        oldObtainedMarks: Number,
        newObtainedMarks: Number,
        oldPercentage: Number,
        newPercentage: Number,
        oldGrade: String,
        newGrade: String,
        correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ organizationId: 1, candidateId: 1 });
resultSchema.index({ organizationId: 1, assessmentId: 1 });
resultSchema.index({ organizationId: 1, status: 1 });

const Result =
  mongoose.models.Result || mongoose.model("Result", resultSchema);

export default Result;
