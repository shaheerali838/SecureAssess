import express from "express";
import {
  getProfile,
  getUserById,
  getOrgUsers,
  updateUser,
  deleteUser,
} from "./user.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

router.use(requireAuth);

router.get("/profile", getProfile);
router.get("/", requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECRUITER), getOrgUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), deleteUser);

export default router;
