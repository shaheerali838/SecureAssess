import { AuthRepository } from "./auth.repository.js";
import { AuthMapper } from "./auth.mapper.js";
import { AUTH_MESSAGES } from "./auth.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.js";
import { eventBus } from "../../events/eventBus.js";
import { USER_EVENTS } from "../../events/user.events.js";

export class AuthService {
  static async register({ name, email, password, role, organizationId }) {
    const existingUser = await AuthRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, AUTH_MESSAGES.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await hashPassword(password);
    const user = await AuthRepository.createUser({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      organizationId: organizationId || null,
    });

    eventBus.emit(USER_EVENTS.REGISTERED, { id: user._id, email: user.email, role: user.role });

    return AuthMapper.toUserDTO(user);
  }

  static async login({ email, password, role }) {
    const user = await AuthRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }

    if (role && user.role !== role) {
      throw new ApiError(403, `Access denied for specified role: ${role}`);
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      permissions: user.permissions || [],
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await AuthRepository.updateLastLogin(user._id);

    return AuthMapper.toAuthDTO(user, accessToken, refreshToken);
  }

  static async refresh(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await AuthRepository.findById(decoded.id);
      if (!user) {
        throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
      }

      const tokenPayload = {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        permissions: user.permissions || [],
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      return { token: newAccessToken };
    } catch (error) {
      throw new ApiError(401, "Invalid or expired refresh token", [error.message]);
    }
  }
}
