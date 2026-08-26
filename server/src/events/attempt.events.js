import { eventBus } from "./eventBus.js";
import { logger } from "../config/logger.js";

export const ATTEMPT_EVENTS = Object.freeze({
  STARTED: "attempt.started",
  SUBMITTED: "attempt.submitted",
  FLAGGED: "attempt.flagged",
});

eventBus.on(ATTEMPT_EVENTS.FLAGGED, (data) => {
  logger.warn(`[Event] Potential integrity violation in attempt: ${data.attemptId}`);
});
