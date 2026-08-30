import { ReportAggregations } from "../report.aggregations.js";
import { ExportService } from "../../../services/export/export.service.js";

export class CandidateReportGenerator {
  static async generate(organizationId, candidateId, format = "JSON", filters = {}) {
    const data = await ReportAggregations.getCandidateStatistics(organizationId, candidateId, filters);

    if (format === "CSV") {
      const flat = [{
        candidateName: data.candidate?.name || "N/A",
        candidateEmail: data.candidate?.email || "N/A",
        candidateCode: data.candidate?.code || "N/A",
        assessmentsAssigned: data.assessmentsAssigned,
        attemptsCompleted: data.attemptsCompleted,
        averagePercentage: data.averagePercentage,
        passRate: data.passRate,
        violations: data.totalProctoringViolations,
      }];
      const fileContent = await ExportService.exportToCsv(flat);
      return { data, fileContent, contentType: "text/csv" };
    }

    return data;
  }
}
