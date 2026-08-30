import Certificate from "./certificate.model.js";
import { CERTIFICATE_STATUSES } from "./certificate.constants.js";

export class VerificationService {
  /**
   * Public certificate verification endpoint logic
   * Sanitizes all sensitive internal IDs and candidate private metadata
   */
  static async verifyCertificate(verificationCode) {
    if (!verificationCode || typeof verificationCode !== "string") {
      return { valid: false, message: "Invalid verification code format" };
    }

    const cleanCode = verificationCode.trim().toUpperCase();
    const certificate = await Certificate.findOne({ verificationCode: cleanCode }).lean();

    if (!certificate) {
      return {
        valid: false,
        message: "Certificate not found. Please verify the code and try again.",
      };
    }

    if (certificate.status === CERTIFICATE_STATUSES.REVOKED) {
      return {
        valid: false,
        status: CERTIFICATE_STATUSES.REVOKED,
        certificateNumber: certificate.certificateNumber,
        recipientName: certificate.recipientName,
        title: certificate.title,
        issuerName: certificate.issuerName,
        revokedAt: certificate.revokedAt,
        message: "This certificate has been officially revoked by the issuing authority.",
      };
    }

    if (certificate.expiresAt && new Date(certificate.expiresAt) < new Date()) {
      return {
        valid: false,
        status: CERTIFICATE_STATUSES.EXPIRED,
        certificateNumber: certificate.certificateNumber,
        recipientName: certificate.recipientName,
        title: certificate.title,
        issuerName: certificate.issuerName,
        expiresAt: certificate.expiresAt,
        message: "This certificate has expired.",
      };
    }

    return {
      valid: true,
      status: certificate.status,
      certificateNumber: certificate.certificateNumber,
      recipientName: certificate.recipientName,
      title: certificate.title,
      issuerName: certificate.issuerName,
      issuerTitle: certificate.issuerTitle,
      issuedAt: certificate.issuedAt,
      percentage: certificate.percentage,
      grade: certificate.grade,
      type: certificate.type,
      message: "Certificate is authentic and verified.",
    };
  }
}
