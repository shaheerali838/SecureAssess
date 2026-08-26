import { logger } from "../config/logger.js";

export const runAssessmentExpiryJob = async () => {
  logger.info("[Job] Checking and expiring overdue assessment attempts...");
  // Logic to find IN_PROGRESS attempts past duration + buffer and mark as EXPIRED
  return { processed: 0 };
};
