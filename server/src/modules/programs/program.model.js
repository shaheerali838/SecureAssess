import mongoose from "mongoose";

const programSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, "Program code is required"],
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    level: {
      type: String,
      enum: [
        "UNDERGRADUATE",
        "GRADUATE",
        "POSTGRADUATE",
        "DIPLOMA",
        "CERTIFICATION",
        "CORPORATE",
        "OTHER",
      ],
      default: "UNDERGRADUATE",
    },
    duration: {
      type: String,
      default: "",
      trim: true,
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
programSchema.index({ organizationId: 1, code: 1 }, { unique: true });
programSchema.index({ organizationId: 1, departmentId: 1 });
programSchema.index({ organizationId: 1, status: 1 });

const Program =
  mongoose.models.Program || mongoose.model("Program", programSchema);

export default Program;
