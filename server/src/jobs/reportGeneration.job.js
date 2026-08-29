import Report from "../modules/reports/report.model.js";
import { ReportService } from "../modules/reports/report.service.js";
import { REPORT_STATUSES } from "../modules/reports/report.constants.js";
import { logger } from "../config/logger.js";

export const runReportGenerationJob = async (batchSize = 10) => {
  logger.info("[Job] Generating pending assessment aggregate reports...");

  const pendingReports = await Report.find({ status: REPORT_STATUSES.PENDING })
    .limit(batchSize)
    .sort({ createdAt: 1 });

  let processedCount = 0;
  let failedCount = 0;

  for (const rep of pendingReports) {
    try {
      await ReportService.exportReport(rep.organizationId, rep.generatedBy, {
        type: rep.type,
        format: rep.format,
        targetId: rep.filters?.targetId,
        name: rep.name,
        filters: rep.filters,
      });
      processedCount++;
    } catch (err) {
      logger.error(`[Job] Failed to generate report ${rep._id}: ${err.message}`);
      rep.status = REPORT_STATUSES.FAILED;
      rep.metadata = { ...(rep.metadata || {}), error: err.message };
      await rep.save();
      failedCount++;
    }
  }

  return {
    pending: pendingReports.length,
    generated: processedCount,
    failed: failedCount,
  };
};
