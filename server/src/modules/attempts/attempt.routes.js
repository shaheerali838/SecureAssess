import express from "express";
import {
  startAttempt,
  getAttempt,
  getAttemptQuestions,
  getAttemptQuestion,
  heartbeat,
  submitAttempt,
} from "./attempt.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";

const router = express.Router({ mergeParams: true });

// POST /api/v1/organizations/:organizationId/candidate/assignments/:assignmentId/attempts
router.post(
  "/assignments/:assignmentId/attempts",
  requireAuth,
  requireTenantContext,
  startAttempt
);

// GET /api/v1/organizations/:organizationId/candidate/attempts/:attemptId
router.get(
  "/attempts/:attemptId",
  requireAuth,
  requireTenantContext,
  getAttempt
);

// GET /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/questions
router.get(
  "/attempts/:attemptId/questions",
  requireAuth,
  requireTenantContext,
  getAttemptQuestions
);

// GET /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/questions/:attemptQuestionId
router.get(
  "/attempts/:attemptId/questions/:attemptQuestionId",
  requireAuth,
  requireTenantContext,
  getAttemptQuestion
);

// POST /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/heartbeat
router.post(
  "/attempts/:attemptId/heartbeat",
  requireAuth,
  requireTenantContext,
  heartbeat
);

// POST /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/submit
router.post(
  "/attempts/:attemptId/submit",
  requireAuth,
  requireTenantContext,
  submitAttempt
);

export default router;
