import express from "express";
import {
  createInterview,
  getInterviews,
  getMyInterviews,
  getInterviewById,
  joinInterview,
  endInterview,
  cancelInterview,
  addParticipant,
  removeParticipant,
} from "./interview.controller.js";
import {
  createInterviewSchema,
  updateInterviewSchema,
  addParticipantSchema,
} from "./interview.validation.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { INTERVIEW_PERMISSIONS } from "./interview.permissions.js";

const router = express.Router({ mergeParams: true });

// --- Candidate Self-Service Route ---
router.get(
  "/candidate/interviews",
  requireAuth,
  requireTenantContext,
  getMyInterviews
);

// --- Organization Management Routes ---
router.get(
  "/interviews",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.VIEW,
    INTERVIEW_PERMISSIONS.VIEW
  ),
  getInterviews
);

router.post(
  "/interviews",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.CREATE,
    INTERVIEW_PERMISSIONS.CREATE
  ),
  validateRequest(createInterviewSchema),
  createInterview
);

router.get(
  "/interviews/:interviewId",
  requireAuth,
  requireTenantContext,
  getInterviewById
);

router.post(
  "/interviews/:interviewId/join",
  requireAuth,
  requireTenantContext,
  joinInterview
);

router.post(
  "/interviews/:interviewId/end",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.END,
    INTERVIEW_PERMISSIONS.END
  ),
  endInterview
);

router.post(
  "/interviews/:interviewId/cancel",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.UPDATE,
    INTERVIEW_PERMISSIONS.UPDATE
  ),
  cancelInterview
);

router.post(
  "/interviews/:interviewId/participants",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.MANAGE_PARTICIPANTS,
    INTERVIEW_PERMISSIONS.MANAGE_PARTICIPANTS
  ),
  validateRequest(addParticipantSchema),
  addParticipant
);

router.delete(
  "/interviews/:interviewId/participants/:userId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.MANAGE_PARTICIPANTS,
    INTERVIEW_PERMISSIONS.MANAGE_PARTICIPANTS
  ),
  removeParticipant
);

export default router;
