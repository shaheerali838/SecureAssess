import { ReportAggregations } from "../report.aggregations.js";
import { ExportService } from "../../../services/export/export.service.js";
import { PdfService } from "../../../services/pdf/pdf.service.js";

export class AssessmentReportGenerator {
  static async generate(organizationId, assessmentId, format = "JSON", filters = {}) {
    const data = await ReportAggregations.getAssessmentStatistics(organizationId, assessmentId, filters);

    if (format === "CSV") {
      const flat = [{
        assessmentTitle: data.assessment?.title || "N/A",
        assessmentCode: data.assessment?.code || "N/A",
        totalAssignments: data.totalAssignments,
        totalStarted: data.totalStarted,
        completedAttempts: data.completedAttempts,
        averagePercentage: data.averagePercentage,
        passRate: data.passRate,
        completionRate: data.completionRate,
      }];
      const fileContent = await ExportService.exportToCsv(flat);
      return { data, fileContent, contentType: "text/csv" };
    }

    if (format === "PDF") {
      const pdfMeta = await PdfService.generateAssessmentReportPdf({
        attemptId: assessmentId,
        candidateName: data.assessment?.title || "Assessment Report",
      });
      return { data, fileUrl: pdfMeta.url, contentType: "application/pdf" };
    }

    return data;
  }
}
