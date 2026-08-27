import mongoose from "mongoose";

const userMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INVITED", "SUSPENDED", "DEACTIVATED"],
      default: "ACTIVE",
      index: true,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    invitedAt: {
      type: Date,
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    deactivatedAt: {
      type: Date,
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

// Compound unique index: prevents duplicate memberships for same user and organization
userMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
userMembershipSchema.index({ organizationId: 1, status: 1 });
userMembershipSchema.index({ organizationId: 1, roleId: 1 });

const UserMembership =
  mongoose.models.UserMembership ||
  mongoose.model("UserMembership", userMembershipSchema);

export default UserMembership;
