import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    headUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

// Compound indexes
departmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });
departmentSchema.index({ organizationId: 1, status: 1 });
departmentSchema.index({ organizationId: 1, name: 1 });

const Department =
  mongoose.models.Department ||
  mongoose.model("Department", departmentSchema);

export default Department;
