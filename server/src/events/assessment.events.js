import { eventBus } from "./eventBus.js";
import { logger } from "../config/logger.js";

export const ASSESSMENT_EVENTS = Object.freeze({
  CREATED: "assessment.created",
  PUBLISHED: "assessment.published",
  ARCHIVED: "assessment.archived",
});

eventBus.on(ASSESSMENT_EVENTS.CREATED, (data) => {
  logger.info(`[Event] Assessment created: ${data.id}`);
});
