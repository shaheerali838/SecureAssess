import express from "express";
import {
  createAssessment,
  getAssessmentById,
  listAssessments,
  updateAssessment,
  publishAssessment,
  deleteAssessment,
} from "./assessment.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRoles } from "../../middleware/role.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";
import { ROLES } from "../../constants/roles.js";

const router = express.Router();

// All assessment management routes require authentication and tenant context
router.use(requireAuth);
router.use(requireTenant);

router.post(
  "/",
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECRUITER, ROLES.EXAMINER),
  createAssessment
);

router.get(
  "/",
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECRUITER, ROLES.EXAMINER),
  listAssessments
);

router.get("/:id", getAssessmentById);

router.patch(
  "/:id",
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECRUITER, ROLES.EXAMINER),
  updateAssessment
);

router.patch(
  "/:id/publish",
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.RECRUITER, ROLES.EXAMINER),
  publishAssessment
);

router.delete(
  "/:id",
  requireRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  deleteAssessment
);

export default router;
