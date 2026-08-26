import bcrypt from "bcryptjs";
import { SYSTEM_CONSTANTS } from "../constants/systemConstants.js";

export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SYSTEM_CONSTANTS.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
