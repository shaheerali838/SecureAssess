import mongoose from "mongoose";
import { ROLE_SCOPES } from "../../constants/roles.js";

const permissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, "Permission key is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    resource: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    action: {
      type: String,
      required: [true, "Action name is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    scope: {
      type: String,
      enum: Object.values(ROLE_SCOPES),
      required: [true, "Permission scope is required (PLATFORM or ORGANIZATION)"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ scope: 1, resource: 1 });

const Permission =
  mongoose.models.Permission || mongoose.model("Permission", permissionSchema);

export default Permission;
