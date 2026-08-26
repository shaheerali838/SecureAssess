import { eventBus } from "./eventBus.js";
import { logger } from "../config/logger.js";

export const RESULT_EVENTS = Object.freeze({
  EVALUATED: "result.evaluated",
  PUBLISHED: "result.published",
});

eventBus.on(RESULT_EVENTS.EVALUATED, (data) => {
  logger.info(`[Event] Result calculated for attempt: ${data.attemptId}`);
});
