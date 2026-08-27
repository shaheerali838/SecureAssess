import crypto from "crypto";
import User from "../users/user.model.js";
import UserMembership from "../users/userMembership.model.js";
import Session from "./session.model.js";
import { UserMapper } from "../users/user.mapper.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateAccessToken } from "../../utils/token.js";
import { USER_STATUSES } from "../../constants/userStatuses.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * SHA-256 Hash helper for tokens (refresh tokens, reset tokens, verification tokens)
 */
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export class AuthService {
  /**
   * Authenticates user credentials, creates a session, and issues tokens
   */
  static async login({ email, password, userAgent = "", ipAddress = "", device = "" }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // Account status checks
    if (user.status === USER_STATUSES.INVITED) {
      throw new ApiError(
        403,
        "Account has been invited. Please complete your account setup and password configuration before logging in."
      );
    }
    if (user.status === USER_STATUSES.SUSPENDED) {
      throw new ApiError(403, "Account is suspended. Please contact platform support.");
    }
    if (user.status === USER_STATUSES.DEACTIVATED) {
      throw new ApiError(403, "Account is deactivated.");
    }
    if (user.status !== USER_STATUSES.ACTIVE) {
      throw new ApiError(403, `Account status is '${user.status}'. Access denied.`);
    }

    // Verify password hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      await user.save();
      throw new ApiError(401, "Invalid email or password");
    }

    // Reset failed login attempts and update last login
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    await user.save();

    // Create a new session with Refresh Token & Token Family
    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const refreshTokenHash = hashToken(rawRefreshToken);
    const tokenFamily = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await Session.create({
      userId: user._id,
      refreshTokenHash,
      tokenFamily,
      userAgent: userAgent || "",
      ipAddress: ipAddress || "",
      device: device || "Browser / Client",
      expiresAt,
      lastUsedAt: new Date(),
    });

    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      sessionId: session._id.toString(),
      type: "access",
    });

    // Resolve user's active memberships
    const memberships = await UserMembership.find({
      userId: user._id,
      status: "ACTIVE",
    })
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions");

    return {
      user: UserMapper.toDTO(user),
      memberships: UserMapper.toMembershipDTOList(memberships),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: "1d",
      },
      sessionId: session._id,
    };
  }

  /**
   * Refreshes access token and rotates refresh token with reuse detection
   */
  static async refreshToken({ refreshToken, userAgent = "", ipAddress = "" }) {
    if (!refreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    const incomingHash = hashToken(refreshToken);

    // 1. Check if an active session holds this token hash
    let session = await Session.findOne({ refreshTokenHash: incomingHash });

    if (!session) {
      // Check if this token was previously rotated (Token Reuse Attack)
      const reusedSession = await Session.findOne({
        refreshTokenHash: incomingHash,
        revokedAt: { $ne: null },
      });

      if (reusedSession) {
        // TOKEN REUSE DETECTED: Revoke entire token family
        await Session.updateMany(
          { tokenFamily: reusedSession.tokenFamily, revokedAt: null },
          {
            $set: {
              revokedAt: new Date(),
              revokeReason: "TOKEN_REUSE_DETECTED",
            },
          }
        );

        throw new ApiError(
          401,
          "Security alert: Token reuse detected. Session family has been revoked. Please log in again."
        );
      }

      throw new ApiError(401, "Invalid refresh token");
    }

    // 2. Check revocation & expiry
    if (session.revokedAt) {
      throw new ApiError(401, "Session has been revoked. Please log in again.");
    }
    if (session.expiresAt < new Date()) {
      throw new ApiError(401, "Session has expired. Please log in again.");
    }

    // 3. Check User status
    const user = await User.findById(session.userId);
    if (!user || user.status !== USER_STATUSES.ACTIVE) {
      throw new ApiError(403, "User account is no longer active.");
    }

    // 4. Token Rotation: Issue new refresh token and update session
    const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
    const newRefreshTokenHash = hashToken(newRawRefreshToken);

    session.refreshTokenHash = newRefreshTokenHash;
    session.lastUsedAt = new Date();
    if (userAgent) session.userAgent = userAgent;
    if (ipAddress) session.ipAddress = ipAddress;
    await session.save();

    const newAccessToken = generateAccessToken({
      sub: user._id.toString(),
      sessionId: session._id.toString(),
      type: "access",
    });

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
        expiresIn: "1d",
      },
    };
  }

  /**
   * Revokes single session on logout
   */
  static async logout(sessionId, userId) {
    if (sessionId) {
      await Session.findOneAndUpdate(
        { _id: sessionId, userId },
        { $set: { revokedAt: new Date(), revokeReason: "USER_LOGOUT" } }
      );
    }
    return { success: true, message: "Logged out successfully" };
  }

  /**
   * Revokes all active sessions for a user
   */
  static async logoutAll(userId) {
    await Session.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "USER_LOGOUT_ALL" } }
    );
    return { success: true, message: "All sessions have been revoked successfully" };
  }

  /**
   * Returns current authenticated user profile and memberships
   */
  static async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const memberships = await UserMembership.find({
      userId,
      status: "ACTIVE",
    })
      .populate("organizationId", "name slug code type status")
      .populate("roleId", "name scope isSystemRole permissions");

    return {
      user: UserMapper.toDTO(user),
      memberships: UserMapper.toMembershipDTOList(memberships),
    };
  }

  /**
   * Changes user password and revokes all other active sessions
   */
  static async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ApiError(400, "Current password is incorrect");
    }

    const newHash = await hashPassword(newPassword);
    user.passwordHash = newHash;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // Revoke all active sessions
    await Session.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "PASSWORD_CHANGED" } }
    );

    return { success: true, message: "Password changed successfully. Please log in again with your new password." };
  }

  /**
   * Generates password reset token without leaking user existence
   */
  static async forgotPassword(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && user.status === USER_STATUSES.ACTIVE) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);

      user.passwordResetTokenHash = tokenHash;
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      // Return generated token for test environments/logging
      return {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
        resetToken: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? rawToken : undefined,
      };
    }

    return {
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    };
  }

  /**
   * Resets password using valid token and revokes existing sessions
   */
  static async resetPassword({ token, newPassword }) {
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired password reset token");
    }

    const newHash = await hashPassword(newPassword);
    user.passwordHash = newHash;
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    if (user.status === USER_STATUSES.INVITED) {
      user.status = USER_STATUSES.ACTIVE;
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
    }
    await user.save();

    // Revoke all sessions
    await Session.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "PASSWORD_RESET" } }
    );

    return { success: true, message: "Password reset successfully. You can now log in with your new password." };
  }

  /**
   * Verifies email address using token
   */
  static async verifyEmail(token) {
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired email verification token");
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    return { success: true, message: "Email verified successfully" };
  }

  /**
   * Resends email verification token
   */
  static async resendVerification(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && !user.emailVerified) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.emailVerificationTokenHash = hashToken(rawToken);
      user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      return {
        success: true,
        message: "Verification email has been resent.",
        verificationToken: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? rawToken : undefined,
      };
    }

    return {
      success: true,
      message: "If an unverified account with that email exists, a verification link has been sent.",
    };
  }

  /**
   * Accepts invitation and sets password
   */
  static async acceptInvitation({ token, password, firstName, lastName, userAgent = "", ipAddress = "" }) {
    if (!token || !password) {
      throw new ApiError(400, "Token and password are required");
    }
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      $or: [
        { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() } },
        { emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: { $gt: new Date() } },
      ],
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired invitation token");
    }

    const newHash = await hashPassword(password);
    user.passwordHash = newHash;
    user.status = USER_STATUSES.ACTIVE;
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    await user.save();

    // Activate invited memberships
    await UserMembership.updateMany(
      { userId: user._id, status: "INVITED" },
      { $set: { status: "ACTIVE", joinedAt: new Date() } }
    );

    return this.login({ email: user.email, password, userAgent, ipAddress });
  }
}

