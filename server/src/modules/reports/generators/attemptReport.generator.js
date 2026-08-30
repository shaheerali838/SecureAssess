import { ReportAggregations } from "../report.aggregations.js";
import { ExportService } from "../../../services/export/export.service.js";

export class AttemptReportGenerator {
  static async generate(organizationId, attemptId, format = "JSON") {
    const data = await ReportAggregations.getAttemptStatistics(organizationId, attemptId);

    if (format === "CSV") {
      const flat = [{
        attemptId: data.attempt?.id || "N/A",
        status: data.attempt?.status || "N/A",
        assessmentTitle: data.attempt?.assessment?.title || "N/A",
        candidateName: `${data.attempt?.candidate?.firstName || ""} ${data.attempt?.candidate?.lastName || ""}`.trim(),
        totalScore: data.result?.totalScore ?? "N/A",
        percentage: data.result?.percentage ?? "N/A",
        passed: data.result?.passed ?? "N/A",
        proctoringRisk: data.proctoring?.riskLevel || "NONE",
      }];
      const fileContent = await ExportService.exportToCsv(flat);
      return { data, fileContent, contentType: "text/csv" };
    }

    return data;
  }
}
