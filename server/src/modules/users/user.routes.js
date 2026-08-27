import express from "express";
import {
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
} from "./user.controller.js";
import {
  createMembership,
  getMyMemberships,
} from "./userMembership.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router();

// GET /api/v1/users/me/memberships - Get logged-in user's memberships
router.get("/me/memberships", requireAuth, getMyMemberships);

// GET /api/v1/users - List users
router.get("/", requireAuth, listUsers);

// GET /api/v1/users/:userId - Get user profile
router.get("/:userId", requireAuth, getUserById);

// PATCH /api/v1/users/:userId - Update user profile
router.patch("/:userId", requireAuth, updateUser);

// PATCH /api/v1/users/:userId/status - Update user status (Platform only)
router.patch(
  "/:userId/status",
  requireAuth,
  requirePlatformPermission(PERMISSIONS.PLATFORM_USERS_SUSPEND),
  updateUserStatus
);

// POST /api/v1/users/:userId/memberships - Assign user to organization with a role
router.post("/:userId/memberships", requireAuth, createMembership);

export default router;
