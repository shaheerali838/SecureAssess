import { logger } from "../../config/logger.js";

export class PdfService {
  static async generateCertificatePdf({ candidateName, assessmentTitle, score, date }) {
    logger.info(`[PdfService] Generating certificate PDF for ${candidateName} - ${assessmentTitle}`);
    return {
      success: true,
      filename: `certificate_${Date.now()}.pdf`,
      url: `/uploads/certificates/cert_${Date.now()}.pdf`,
    };
  }

  static async generateAssessmentReportPdf({ attemptId, candidateName }) {
    logger.info(`[PdfService] Generating report PDF for attempt ${attemptId}`);
    return {
      success: true,
      filename: `report_${attemptId}.pdf`,
      url: `/uploads/reports/report_${attemptId}.pdf`,
    };
  }
}
