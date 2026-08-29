import express from "express";
import {
  startProctoring,
  recordEvent,
  sendHeartbeat,
  endProctoring,
  getSessionDetails,
  getSessionEvents,
  getSessionTimeline,
  sendWarning,
  pauseSession,
  terminateSession,
  getSessionEvidence,
  getEvidenceById,
  reviewEvent,
} from "./proctoring.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Core Proctoring APIs (Mounted at /api/v1/proctoring) ---

// POST /api/v1/proctoring/sessions/start
router.post(
  "/sessions/start",
  requireAuth,
  startProctoring
);

// GET /api/v1/proctoring/sessions/:sessionId
router.get(
  "/sessions/:sessionId",
  requireAuth,
  getSessionDetails
);

// POST /api/v1/proctoring/sessions/:sessionId/end
router.post(
  "/sessions/:sessionId/end",
  requireAuth,
  endProctoring
);

// POST /api/v1/proctoring/events
router.post(
  "/events",
  requireAuth,
  recordEvent
);

// GET /api/v1/proctoring/sessions/:sessionId/events
router.get(
  "/sessions/:sessionId/events",
  requireAuth,
  getSessionEvents
);

// GET /api/v1/proctoring/sessions/:sessionId/timeline
router.get(
  "/sessions/:sessionId/timeline",
  requireAuth,
  getSessionTimeline
);

// GET /api/v1/proctoring/sessions/:sessionId/evidence
router.get(
  "/sessions/:sessionId/evidence",
  requireAuth,
  getSessionEvidence
);

// GET /api/v1/proctoring/evidence/:evidenceId
router.get(
  "/evidence/:evidenceId",
  requireAuth,
  getEvidenceById
);

// POST /api/v1/proctoring/sessions/:sessionId/warning
router.post(
  "/sessions/:sessionId/warning",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_MONITOR
  ),
  sendWarning
);

// POST /api/v1/proctoring/sessions/:sessionId/pause
router.post(
  "/sessions/:sessionId/pause",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_MONITOR
  ),
  pauseSession
);

// POST /api/v1/proctoring/sessions/:sessionId/terminate
router.post(
  "/sessions/:sessionId/terminate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_MONITOR
  ),
  terminateSession
);

// PATCH /api/v1/proctoring/events/:eventId/review
router.patch(
  "/events/:eventId/review",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_REVIEW,
    PERMISSIONS.PROCTORING_REVIEW
  ),
  reviewEvent
);

// --- Candidate Proctoring Runtime Endpoints (Nested for legacy compatibility) ---
router.post(
  "/candidate/attempts/:attemptId/proctoring/start",
  requireAuth,
  startProctoring
);

router.post(
  "/candidate/proctoring/:sessionId/events",
  requireAuth,
  recordEvent
);

router.post(
  "/candidate/proctoring/:sessionId/heartbeat",
  requireAuth,
  sendHeartbeat
);

router.post(
  "/candidate/proctoring/:sessionId/end",
  requireAuth,
  endProctoring
);

router.get(
  "/proctoring/sessions/:sessionId",
  requireAuth,
  getSessionDetails
);

router.get(
  "/proctoring/sessions/:sessionId/events",
  requireAuth,
  getSessionEvents
);

router.get(
  "/proctoring/sessions/:sessionId/timeline",
  requireAuth,
  getSessionTimeline
);

router.patch(
  "/proctoring/events/:eventId/review",
  requireAuth,
  reviewEvent
);

export default router;
