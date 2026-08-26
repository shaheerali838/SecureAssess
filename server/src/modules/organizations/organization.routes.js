import express from "express";
import {
  createOrganization,
  getOrganizationById,
  getCurrentOrganization,
  getPublicProfileBySlug,
  listOrganizations,
  updateOrganization,
  updateSubscription,
  deactivateOrganization,
} from "./organization.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// Public route for candidate branding/onboarding lookup
router.get("/public/:slug", getPublicProfileBySlug);

// Protected routes
router.use(requireAuth);

router.get("/current", getCurrentOrganization);

// Super Admin platform routes
router.post("/", requireRoles(ROLES.SUPER_ADMIN), createOrganization);
router.get("/", requireRoles(ROLES.SUPER_ADMIN), listOrganizations);

// Org Admin / Super Admin routes
router.get(
  "/:id",
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  getOrganizationById
);

router.patch(
  "/:id",
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  updateOrganization
);

router.patch(
  "/:id/subscription",
  requireRoles(ROLES.SUPER_ADMIN),
  updateSubscription
);

router.delete(
  "/:id",
  requireRoles(ROLES.SUPER_ADMIN),
  deactivateOrganization
);

export default router;
