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
  createEvidence,
  getSessionEvidence,
  getEvidenceById,
  reviewEvent,
} from "./proctoring.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Candidate Proctoring Session Lifecycle Endpoints ---
router.post("/sessions/start", requireAuth, startProctoring);
router.post("/start", requireAuth, startProctoring);
router.post("/attempts/:attemptId/start", requireAuth, startProctoring);

router.post("/sessions/:sessionId/heartbeat", requireAuth, sendHeartbeat);
router.post("/:sessionId/heartbeat", requireAuth, sendHeartbeat);

router.post("/sessions/:sessionId/end", requireAuth, endProctoring);
router.post("/:sessionId/end", requireAuth, endProctoring);

// --- Proctoring Integrity Events & Evidence Ingestion ---
router.post("/events", requireAuth, recordEvent);
router.post("/sessions/:sessionId/events", requireAuth, recordEvent);
router.post("/:sessionId/events", requireAuth, recordEvent);

router.post("/sessions/:sessionId/evidence", requireAuth, createEvidence);
router.post("/:sessionId/evidence", requireAuth, createEvidence);

// --- Proctor & Examiner Investigation Endpoints ---
router.get(
  "/sessions/:sessionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getSessionDetails
);

router.get(
  "/:sessionId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getSessionDetails
);

router.get(
  "/sessions/:sessionId/events",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getSessionEvents
);

router.get(
  "/:sessionId/events",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getSessionEvents
);

router.get(
  "/sessions/:sessionId/timeline",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getSessionTimeline
);

router.get(
  "/:sessionId/timeline",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getSessionTimeline
);

router.get(
  "/sessions/:sessionId/evidence",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getSessionEvidence
);

router.get(
  "/:sessionId/evidence",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getSessionEvidence
);

router.get(
  "/evidence/:evidenceId",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_VIEW
  ),
  getEvidenceById
);

// --- Live Proctor Intervention Endpoints ---
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

router.post(
  "/:sessionId/warning",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_MONITOR
  ),
  sendWarning
);

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

router.post(
  "/:sessionId/pause",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_MONITOR
  ),
  pauseSession
);

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

router.post(
  "/:sessionId/terminate",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_MONITOR
  ),
  terminateSession
);

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

export default router;
