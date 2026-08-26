import mongoose from "mongoose";
import { ROLE_LIST, ROLES } from "../../constants/roles.js";
import { USER_STATUSES, USER_STATUS_LIST } from "../../constants/userStatuses.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ROLE_LIST,
      default: ROLES.CANDIDATE,
      required: true,
    },
    status: {
      type: String,
      enum: USER_STATUS_LIST,
      default: USER_STATUSES.ACTIVE,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    permissions: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
