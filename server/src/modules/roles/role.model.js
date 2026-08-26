import mongoose from "mongoose";
import { ROLE_SCOPES } from "../../constants/roles.js";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      index: true,
    },
    scope: {
      type: String,
      enum: Object.values(ROLE_SCOPES),
      required: [true, "Role scope is required (PLATFORM or ORGANIZATION)"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isSystemRole: {
      type: Boolean,
      default: false,
      index: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: System roles have organizationId: null, custom roles belong to a tenant
roleSchema.index({ name: 1, scope: 1, organizationId: 1 }, { unique: true });

const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);

export default Role;
