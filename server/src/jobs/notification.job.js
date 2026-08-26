import { logger } from "../config/logger.js";

export const runNotificationJob = async () => {
  logger.info("[Job] Processing queued notifications...");
  return { sent: 0 };
};
