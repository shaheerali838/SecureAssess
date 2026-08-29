import express from "express";
import {
  startAttempt,
  getAttempts,
  getAttempt,
  getAttemptQuestions,
  getAttemptQuestion,
  saveAnswer,
  flagQuestion,
  heartbeat,
  submitAttempt,
  terminateAttempt,
} from "./attempt.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

// Start a new attempt or resume active attempt
router.post("/start", requireAuth, startAttempt);
router.post("/assignments/:assignmentId/start", requireAuth, startAttempt);

// List attempts for authenticated candidate
router.get("/", requireAuth, getAttempts);

// Get specific attempt details
router.get("/:attemptId", requireAuth, getAttempt);

// Questions in attempt
router.get("/:attemptId/questions", requireAuth, getAttemptQuestions);
router.get("/:attemptId/questions/:questionId", requireAuth, getAttemptQuestion);

// Save candidate answer (Autosave & Updates)
router.put("/:attemptId/questions/:questionId/answer", requireAuth, saveAnswer);
router.post("/:attemptId/questions/:questionId/answer", requireAuth, saveAnswer);

// Flag question for review
router.patch("/:attemptId/questions/:questionId/flag", requireAuth, flagQuestion);

// Heartbeat
router.post("/:attemptId/heartbeat", requireAuth, heartbeat);

// Final Submission
router.post("/:attemptId/submit", requireAuth, submitAttempt);

// Terminate Attempt (Proctor / Policy)
router.post("/:attemptId/terminate", requireAuth, terminateAttempt);

export default router;
