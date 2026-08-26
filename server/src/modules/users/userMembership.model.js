import mongoose from "mongoose";
import { USER_STATUS_LIST, USER_STATUSES } from "../../constants/userStatuses.js";

const userMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required for membership"],
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required for membership"],
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role ID is required for membership"],
      index: true,
    },
    status: {
      type: String,
      enum: USER_STATUS_LIST,
      default: USER_STATUSES.ACTIVE,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// A user can have only one active membership per organization
userMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
userMembershipSchema.index({ organizationId: 1, roleId: 1 });
userMembershipSchema.index({ organizationId: 1, status: 1 });

const UserMembership =
  mongoose.models.UserMembership ||
  mongoose.model("UserMembership", userMembershipSchema);

export default UserMembership;
