import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: [true, "Program ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    credits: {
      type: Number,
      default: 3,
      min: 0,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
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

// Indexes
subjectSchema.index({ organizationId: 1, code: 1 }, { unique: true });
subjectSchema.index({ organizationId: 1, programId: 1 });
subjectSchema.index({ organizationId: 1, status: 1 });

const Subject =
  mongoose.models.Subject || mongoose.model("Subject", subjectSchema);

export default Subject;
