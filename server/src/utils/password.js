import bcrypt from "bcryptjs";
import { SYSTEM_CONSTANTS } from "../constants/systemConstants.js";

/**
 * Hashes a plaintext password using bcrypt with standard salt rounds.
 */
export const hashPassword = async (plainPassword) => {
  if (!plainPassword || typeof plainPassword !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  return bcrypt.hash(plainPassword, SYSTEM_CONSTANTS.BCRYPT_SALT_ROUNDS);
};

/**
 * Compares and verifies a plaintext password against a stored password hash.
 */
export const comparePassword = async (plainPassword, passwordHash) => {
  if (!plainPassword || !passwordHash) return false;
  return bcrypt.compare(plainPassword, passwordHash);
};

export const verifyPassword = comparePassword;
