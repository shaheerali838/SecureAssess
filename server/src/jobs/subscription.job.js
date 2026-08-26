import { logger } from "../config/logger.js";

export const runSubscriptionJob = async () => {
  logger.info("[Job] Checking trial and subscription expirations...");
  return { updated: 0 };
};
