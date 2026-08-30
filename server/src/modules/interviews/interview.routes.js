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

// --- Candidate Self-Service Routes ---
router.get(
  "/my",
  requireAuth,
  requireTenantContext,
  getMyInterviews
);

router.get(
  "/candidate/interviews",
  requireAuth,
  requireTenantContext,
  getMyInterviews
);

router.get(
  "/candidate-portal/interviews",
  requireAuth,
  requireTenantContext,
  getMyInterviews
);

router.get(
  "/candidate-portal/interviews/:interviewId",
  requireAuth,
  requireTenantContext,
  getInterviewById
);

router.post(
  "/candidate-portal/interviews/:interviewId/join",
  requireAuth,
  requireTenantContext,
  joinInterview
);

// --- Organization Interview Management Endpoints ---

// GET / - List interviews for organization
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.VIEW,
    INTERVIEW_PERMISSIONS.VIEW
  ),
  getInterviews
);

// GET /interviews - Alias
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

// POST / - Create interview
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.CREATE,
    INTERVIEW_PERMISSIONS.CREATE
  ),
  validateRequest(createInterviewSchema),
  createInterview
);

// POST /interviews - Alias
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

// GET /:interviewId - Interview details
router.get(
  "/:interviewId",
  requireAuth,
  requireTenantContext,
  getInterviewById
);

// GET /interviews/:interviewId - Alias
router.get(
  "/interviews/:interviewId",
  requireAuth,
  requireTenantContext,
  getInterviewById
);

// POST /:interviewId/join - Join live room
router.post(
  "/:interviewId/join",
  requireAuth,
  requireTenantContext,
  joinInterview
);

// POST /interviews/:interviewId/join - Alias
router.post(
  "/interviews/:interviewId/join",
  requireAuth,
  requireTenantContext,
  joinInterview
);

// POST /:interviewId/end - End interview
router.post(
  "/:interviewId/end",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.END,
    INTERVIEW_PERMISSIONS.END
  ),
  endInterview
);

// POST /interviews/:interviewId/end - Alias
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

// POST /:interviewId/cancel - Cancel interview
router.post(
  "/:interviewId/cancel",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.UPDATE,
    INTERVIEW_PERMISSIONS.UPDATE
  ),
  cancelInterview
);

// POST /interviews/:interviewId/cancel - Alias
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

// POST /:interviewId/participants - Add participant
router.post(
  "/:interviewId/participants",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.MANAGE_PARTICIPANTS,
    INTERVIEW_PERMISSIONS.MANAGE_PARTICIPANTS
  ),
  validateRequest(addParticipantSchema),
  addParticipant
);

// POST /interviews/:interviewId/participants - Alias
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

// DELETE /:interviewId/participants/:userId - Remove participant
router.delete(
  "/:interviewId/participants/:userId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    INTERVIEW_PERMISSIONS.MANAGE_PARTICIPANTS,
    INTERVIEW_PERMISSIONS.MANAGE_PARTICIPANTS
  ),
  removeParticipant
);

// DELETE /interviews/:interviewId/participants/:userId - Alias
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
