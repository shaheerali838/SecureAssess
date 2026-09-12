import crypto from "crypto";
import User from "../users/user.model.js";
import UserMembership from "../users/userMembership.model.js";
import Session from "./session.model.js";
import Candidate from "../candidates/candidate.model.js";
import { UserMapper } from "../users/user.mapper.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateAccessToken } from "../../utils/token.js";
import { USER_STATUSES } from "../../constants/userStatuses.js";
import { ApiError } from "../../utils/ApiError.js";
import { EmailService } from "../../services/email/email.service.js";
import { ENV } from "../../config/env.js";

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
      throw new ApiError(404, "No account found with this email address");
    }

    // Account status checks
    if (user.status === USER_STATUSES.INVITED) {
      throw new ApiError(
        403,
        "Account is pending activation. Please use the activation link sent to your email or reset your password below."
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
      throw new ApiError(401, "Incorrect password. Please try again or reset your password.");
    }

    // Reset failed login attempts and update last login
    user.failedLoginAttempts = 0;
    user.lastLoginAt = new Date();
    if (user.platformRole === "PLATFORM_OWNER") {
      user.platformRole = "PLATFORM_ADMIN";
    }
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
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
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
   * Generates password reset token and sends email
   */
  static async forgotPassword(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new ApiError(404, "No account found with this email address");
    }

    if (user.status === USER_STATUSES.INVITED) {
      throw new ApiError(
        400,
        "Account has not been activated yet. Please use the activation link sent to your email to set your password."
      );
    }

    if (user.status === USER_STATUSES.SUSPENDED || user.status === USER_STATUSES.DEACTIVATED) {
      throw new ApiError(403, `Account is ${user.status.toLowerCase()}. Password reset is not permitted.`);
    }

    if (user.status !== USER_STATUSES.ACTIVE || !user.emailVerified) {
      throw new ApiError(
        400,
        "Account is not verified. Password reset is not available."
      );
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = ENV.CLIENT_URL || "https://secure-assess.vercel.app";
    const resetUrl = `${clientUrl}/login?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}&mode=reset`;

    try {
      await EmailService.sendPasswordResetEmail(normalizedEmail, {
        name: `${user.firstName} ${user.lastName}`.trim() || "User",
        resetUrl,
      });
    } catch (err) {
      console.warn(`[AuthService] Failed to send password reset email: ${err.message}`);
    }

    return {
      success: true,
      message: `Password reset link sent to ${normalizedEmail}. Please check your inbox.`,
      resetToken: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? rawToken : undefined,
    };
  }

  /**
   * Resets password using valid token and revokes existing sessions
   */
  static async resetPassword({ token, newPassword, password }) {
    const rawPass = newPassword || password;
    if (!token || !rawPass) {
      throw new ApiError(400, "Token and new password are required");
    }
    if (rawPass.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters long");
    }

    const cleanToken = String(token).trim();
    const tokenHash = hashToken(cleanToken);

    let user = await User.findOne({
      $or: [
        { passwordResetTokenHash: tokenHash },
        { passwordResetTokenHash: cleanToken },
        { emailVerificationTokenHash: tokenHash },
        { emailVerificationTokenHash: cleanToken },
      ],
    });

    if (user) {
      const isExpired =
        (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date() && (user.passwordResetTokenHash === tokenHash || user.passwordResetTokenHash === cleanToken)) ||
        (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date() && (user.emailVerificationTokenHash === tokenHash || user.emailVerificationTokenHash === cleanToken));

      if (isExpired) {
        throw new ApiError(400, "This password reset link has expired. Please request a new link.");
      }
    }

    let candidate = null;
    if (!user) {
      candidate = await Candidate.findOne({
        $or: [
          { invitationToken: cleanToken },
          { invitationToken: tokenHash },
        ],
      });

      if (candidate) {
        if (candidate.invitationExpiresAt && candidate.invitationExpiresAt < new Date()) {
          throw new ApiError(400, "This invitation link has expired. Please contact your administrator.");
        }
        if (candidate.userId) {
          user = await User.findById(candidate.userId);
        } else if (candidate.email) {
          user = await User.findOne({ email: candidate.email.toLowerCase().trim() });
        }
      }
    }

    if (!user) {
      throw new ApiError(400, "Invalid or expired password reset token. Please request a new link.");
    }

    const newHash = await hashPassword(rawPass);
    user.passwordHash = newHash;
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.status = USER_STATUSES.ACTIVE;
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();

    if (candidate) {
      candidate.status = "ACTIVE";
      candidate.invitationToken = null;
      candidate.invitationExpiresAt = null;
      if (!candidate.userId) candidate.userId = user._id;
      await candidate.save();
    } else {
      await Candidate.updateMany(
        { email: user.email.toLowerCase().trim(), status: "INVITED" },
        { $set: { status: "ACTIVE", invitationToken: null, invitationExpiresAt: null, userId: user._id } }
      );
    }

    // Activate all invited/pending memberships
    await UserMembership.updateMany(
      { userId: user._id, status: { $in: ["INVITED", "PENDING"] } },
      { $set: { status: "ACTIVE", joinedAt: new Date() } }
    );

    // Revoke all sessions
    await Session.updateMany(
      { userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date(), revokeReason: "PASSWORD_RESET" } }
    );

    return { success: true, message: "Password reset successfully. Please log in with your new password." };
  }

  /**
   * Verifies email address using token
   */
  static async verifyEmail(token) {
    if (!token) {
      throw new ApiError(400, "Verification token is required");
    }
    const cleanToken = String(token).trim();
    const tokenHash = hashToken(cleanToken);

    const user = await User.findOne({
      $or: [
        { emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: { $gt: new Date() } },
        { emailVerificationTokenHash: cleanToken, emailVerificationExpiresAt: { $gt: new Date() } },
      ],
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
    if (!email) {
      throw new ApiError(400, "Email address is required");
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new ApiError(404, "No account found with this email address");
    }

    if (user.emailVerified) {
      throw new ApiError(400, "This account is already verified. Please sign in directly.");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationTokenHash = hashToken(rawToken);
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    return {
      success: true,
      message: `Verification email resent to ${normalizedEmail}. Please check your inbox.`,
      verificationToken: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? rawToken : undefined,
    };
  }

  /**
   * Accepts invitation and sets password
   */
  static async acceptInvitation({ token, password, firstName, lastName, userAgent = "", ipAddress = "" }) {
    if (!token || !password) {
      throw new ApiError(400, "Token and password are required");
    }
    const cleanToken = String(token).trim();
    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const tokenHash = hashToken(cleanToken);

    // 1. Check User model for reset or verification token hash or direct token
    let user = await User.findOne({
      $or: [
        { passwordResetTokenHash: tokenHash },
        { emailVerificationTokenHash: tokenHash },
        { passwordResetTokenHash: cleanToken },
        { emailVerificationTokenHash: cleanToken },
      ],
    });

    if (user) {
      const isExpired =
        (user.passwordResetExpiresAt && user.passwordResetExpiresAt < new Date() && (user.passwordResetTokenHash === tokenHash || user.passwordResetTokenHash === cleanToken)) ||
        (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date() && (user.emailVerificationTokenHash === tokenHash || user.emailVerificationTokenHash === cleanToken));

      if (isExpired) {
        throw new ApiError(400, "This activation link has expired. Please request a new invitation or reset link.");
      }
    }

    // 2. Check Candidate model if user not found yet
    let candidate = null;
    if (!user) {
      candidate = await Candidate.findOne({
        $or: [
          { invitationToken: cleanToken },
          { invitationToken: tokenHash },
        ],
      });

      if (candidate) {
        if (candidate.invitationExpiresAt && candidate.invitationExpiresAt < new Date()) {
          throw new ApiError(400, "This invitation link has expired. Please contact your organization administrator.");
        }
        if (candidate.userId) {
          user = await User.findById(candidate.userId);
        } else if (candidate.email) {
          user = await User.findOne({ email: candidate.email.toLowerCase().trim() });
        }
      }
    }

    if (!user) {
      throw new ApiError(400, "This activation link is invalid or has already been used. Please sign in or use Forgot Password.");
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
    user.passwordChangedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    if (firstName && typeof firstName === "string" && firstName.trim()) user.firstName = firstName.trim();
    if (lastName && typeof lastName === "string" && lastName.trim()) user.lastName = lastName.trim();
    await user.save();

    // Activate candidate profile if applicable
    if (candidate) {
      candidate.status = "ACTIVE";
      candidate.invitationToken = null;
      candidate.invitationExpiresAt = null;
      if (!candidate.userId) candidate.userId = user._id;
      await candidate.save();
    } else {
      await Candidate.updateMany(
        { email: user.email.toLowerCase().trim(), status: "INVITED" },
        { $set: { status: "ACTIVE", invitationToken: null, invitationExpiresAt: null, userId: user._id } }
      );
    }

    // Activate invited/pending memberships
    await UserMembership.updateMany(
      { userId: user._id, status: { $in: ["INVITED", "PENDING"] } },
      { $set: { status: "ACTIVE", joinedAt: new Date() } }
    );

    return this.login({ email: user.email, password, userAgent, ipAddress });
  }
}

export default AuthService;



