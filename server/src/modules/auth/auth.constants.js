export const AUTH_CONSTANTS = Object.freeze({
  TOKEN_TYPE: "Bearer",
  COOKIE_NAME: "refreshToken",
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: 30,
});

export const AUTH_MESSAGES = Object.freeze({
  REGISTER_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  TOKEN_REFRESHED: "Token refreshed successfully",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User with this email already exists",
  UNAUTHORIZED: "Unauthorized access",
});
