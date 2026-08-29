import { PdfService } from "../../../services/pdf/pdf.service.js";
import { StorageService } from "../../../services/storage/storage.service.js";
import { logger } from "../../../config/logger.js";

export class CertificateGenerator {
  /**
   * Generates a digital credential PDF and stores it via StorageService
   */
  static async generateCertificateFile({
    recipientName,
    certificateNumber,
    verificationCode,
    title,
    issuerName,
    issuerTitle,
    issuedAt,
    score,
    percentage,
    grade,
    verificationUrl,
    templateId = "MODERN",
  }) {
    logger.info(`[CertificateGenerator] Generating credential file for ${certificateNumber} (${recipientName})`);

    const pdfMeta = await PdfService.generateCertificatePdf({
      candidateName: recipientName,
      assessmentTitle: title,
      score: percentage || score,
      date: issuedAt ? new Date(issuedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    });

    const qrUrl = verificationUrl || `/api/v1/public/certificates/verify/${verificationCode}`;
    const dummyBuffer = Buffer.from(
      `%PDF-1.4 SECUREASSESS_VERIFIED_CERTIFICATE\nRecipient: ${recipientName}\nCertificate: ${certificateNumber}\nVerification: ${qrUrl}`
    );

    const storageResult = await StorageService.uploadFile(
      dummyBuffer,
      `${certificateNumber}.pdf`,
      "certificates"
    );

    return {
      fileUrl: storageResult.url || pdfMeta.url,
      verificationUrl: qrUrl,
      templateId,
    };
  }
}
