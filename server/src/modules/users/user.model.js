import mongoose from "mongoose";
import { USER_STATUSES, USER_STATUS_LIST } from "../../constants/userStatuses.js";
import { PLATFORM_ROLE_LIST } from "../../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    platformRole: {
      type: String,
      enum: [...PLATFORM_ROLE_LIST, null],
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: USER_STATUS_LIST,
      default: USER_STATUSES.ACTIVE,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    // Password reset fields (hashed)
    passwordResetTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    // Email verification fields (hashed)
    emailVerificationTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
    },
    profile: {
      avatar: { type: String, default: "" },
      phone: { type: String, trim: true, default: "" },
      bio: { type: String, trim: true, default: "" },
      timezone: { type: String, default: "UTC" },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for identity & administrative search
userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ platformRole: 1, status: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
