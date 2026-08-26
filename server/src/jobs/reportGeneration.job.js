import { logger } from "../config/logger.js";

export const runReportGenerationJob = async () => {
  logger.info("[Job] Generating pending assessment aggregate reports...");
  return { generated: 0 };
};
