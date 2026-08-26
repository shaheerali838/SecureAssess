import { logger } from "../config/logger.js";

export const runCertificateGenerationJob = async () => {
  logger.info("[Job] Processing passed candidate certificates...");
  return { issued: 0 };
};
