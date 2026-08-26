import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required for session"],
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: [true, "Refresh token hash is required"],
      index: true,
    },
    tokenFamily: {
      type: String,
      required: [true, "Token family ID is required"],
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: [true, "Session expiration date is required"],
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for session verification and active lookups
sessionSchema.index({ userId: 1, revokedAt: 1 });
sessionSchema.index({ tokenFamily: 1, revokedAt: 1 });

const Session =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);

export default Session;
