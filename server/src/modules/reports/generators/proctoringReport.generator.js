import { ReportAggregations } from "../report.aggregations.js";
import { ExportService } from "../../../services/export/export.service.js";

export class ProctoringReportGenerator {
  static async generate(organizationId, format = "JSON", filters = {}) {
    const data = await ReportAggregations.getProctoringStatistics(organizationId, filters);

    if (format === "CSV") {
      const flat = [{
        totalProctoredAttempts: data.totalProctoredAttempts,
        lowRisk: data.lowRiskAttempts,
        mediumRisk: data.mediumRiskAttempts,
        highRisk: data.highRiskAttempts,
        criticalRisk: data.criticalRiskAttempts,
        totalViolations: data.totalViolations,
        averageRiskScore: data.averageRiskScore,
      }];
      const fileContent = await ExportService.exportToCsv(flat);
      return { data, fileContent, contentType: "text/csv" };
    }

    return data;
  }
}
