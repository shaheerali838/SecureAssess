import { ReportAggregations } from "../report.aggregations.js";
import { ExportService } from "../../../services/export/export.service.js";

export class OrganizationReportGenerator {
  static async generate(organizationId, format = "JSON", filters = {}) {
    const data = await ReportAggregations.getOrganizationStatistics(organizationId, filters);

    if (format === "CSV") {
      const flat = [{
        totalAssessments: data.totalAssessments,
        candidates: data.candidates,
        attempts: data.attempts,
        completedAttempts: data.completedAttempts,
        averageScore: data.averageScore,
        passRate: data.passRate,
        proctoredExams: data.proctoredExams,
        pendingEvaluations: data.pendingEvaluations,
      }];
      const fileContent = await ExportService.exportToCsv(flat);
      return { data, fileContent, contentType: "text/csv" };
    }

    return data;
  }
}
