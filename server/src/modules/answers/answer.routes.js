import express from "express";
import {
  saveAnswer,
  getAnswers,
  getQuestionAndAnswer,
  updateCurrentQuestion,
  submitAttempt,
} from "./answer.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";

const router = express.Router({ mergeParams: true });

// PUT /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/questions/:attemptQuestionId/answer
router.put(
  "/attempts/:attemptId/questions/:attemptQuestionId/answer",
  requireAuth,
  requireTenantContext,
  saveAnswer
);

// GET /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/answers
router.get(
  "/attempts/:attemptId/answers",
  requireAuth,
  requireTenantContext,
  getAnswers
);

// GET /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/questions/:attemptQuestionId/detail
router.get(
  "/attempts/:attemptId/questions/:attemptQuestionId/detail",
  requireAuth,
  requireTenantContext,
  getQuestionAndAnswer
);

// PATCH /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/current-question
router.patch(
  "/attempts/:attemptId/current-question",
  requireAuth,
  requireTenantContext,
  updateCurrentQuestion
);

// POST /api/v1/organizations/:organizationId/candidate/attempts/:attemptId/submit
router.post(
  "/attempts/:attemptId/submit",
  requireAuth,
  requireTenantContext,
  submitAttempt
);

export default router;
