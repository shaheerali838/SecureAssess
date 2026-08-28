import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    candidateCode: {
      type: String,
      required: [true, "Candidate code is required"],
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 100,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"],
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
candidateSchema.index({ organizationId: 1, candidateCode: 1 }, { unique: true });
candidateSchema.index({ organizationId: 1, email: 1 });
candidateSchema.index({ organizationId: 1, departmentId: 1 });
candidateSchema.index({ organizationId: 1, programId: 1 });
candidateSchema.index({ organizationId: 1, status: 1 });

const Candidate =
  mongoose.models.Candidate || mongoose.model("Candidate", candidateSchema);

export default Candidate;
