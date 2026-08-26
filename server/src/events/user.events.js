import { eventBus } from "./eventBus.js";
import { logger } from "../config/logger.js";

export const USER_EVENTS = Object.freeze({
  REGISTERED: "user.registered",
  PASSWORD_RESET_REQUESTED: "user.password_reset_requested",
  DEACTIVATED: "user.deactivated",
});

eventBus.on(USER_EVENTS.REGISTERED, (user) => {
  logger.info(`[Event] New user registered: ${user.email}`);
});
