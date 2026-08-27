import express from "express";
import {
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  acceptInvitation,
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = express.Router();

// --- Public Authentication Endpoints ---
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/accept-invitation", acceptInvitation);

// --- Authenticated Account Endpoints ---
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);
router.post("/logout-all", requireAuth, logoutAll);
router.post("/change-password", requireAuth, changePassword);

export default router;
