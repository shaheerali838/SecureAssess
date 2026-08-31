import mongoose from "mongoose";
import Certificate from "./certificate.model.js";
import Result from "../results/result.model.js";
import Attempt from "../attempts/attempt.model.js";
import Assessment from "../assessments/assessment.model.js";
import Candidate from "../candidates/candidate.model.js";
import Organization from "../organizations/organization.model.js";
import { CertificateNumberService } from "./certificateNumber.service.js";
import { CertificateGenerator } from "./generators/certificate.generator.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES } from "../notifications/notification.constants.js";
import { AuditLogService } from "../auditLogs/auditLog.service.js";
import { CERTIFICATE_STATUSES } from "./certificate.constants.js";
import { ApiError } from "../../utils/ApiError.js";

export class CertificateService {
  /**
   * Automatically or manually issues a verifiable credential for a passed, published result
   */
  static async issueCertificateForResult(organizationId, resultId, issuerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      throw new ApiError(400, "Invalid result ID format");
    }

    const result = await Result.findOne({ _id: resultId, organizationId }).lean();
    if (!result) {
      throw new ApiError(404, "Result not found in this organization");
    }

    if (!result.published) {
      throw new ApiError(
        400,
        "Candidate is not eligible for a certificate: Result has not been published yet."
      );
    }

    if (!result.passed) {
      throw new ApiError(
        400,
        "Candidate is not eligible for a certificate: Result did not meet passing score criteria."
      );
    }

    // Idempotency: check if certificate already exists
    const existing = await Certificate.findOne({ resultId: result._id, organizationId });
    if (existing) {
      return existing;
    }

    const [attempt, assessment, candidate, organization] = await Promise.all([
      Attempt.findById(result.attemptId).lean(),
      Assessment.findById(result.assessmentId).lean(),
      Candidate.findById(result.candidateId).lean(),
      Organization.findById(organizationId).lean(),
    ]);

    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found");
    }

    const certificateNumber = await CertificateNumberService.generateCertificateNumber();
    const verificationCode = CertificateNumberService.generateVerificationCode();
    const recipientName = `${candidate.firstName} ${candidate.lastName}`.trim();
    const title = assessment?.title || "Assessment Certification";
    const issuerName = organization?.name || "SecureAssess";

    const generatedFile = await CertificateGenerator.generateCertificateFile({
      recipientName,
      certificateNumber,
      verificationCode,
      title,
      issuerName,
      issuedAt: new Date(),
      score: result.obtainedMarks !== undefined ? result.obtainedMarks : result.earnedPoints,
      percentage: result.percentage,
      grade: result.grade,
      templateId: assessment?.settings?.certificate?.templateId || "MODERN",
    });

    const certificate = await Certificate.create({
      organizationId,
      certificateNumber,
      verificationCode,
      candidateId: candidate._id,
      assessmentId: result.assessmentId,
      attemptId: result.attemptId,
      resultId: result._id,
      type: "ASSESSMENT",
      title,
      description: `Awarded for successfully passing '${title}' with a score of ${result.percentage}%.`,
      recipientName,
      issuedAt: new Date(),
      status: CERTIFICATE_STATUSES.ISSUED,
      score: result.obtainedMarks !== undefined ? result.obtainedMarks : result.earnedPoints,
      percentage: result.percentage,
      grade: result.grade,
      issuerName,
      issuerTitle: "Authorized Examination Authority",
      templateId: generatedFile.templateId,
      fileUrl: generatedFile.fileUrl,
      verificationUrl: generatedFile.verificationUrl,
    });

    // Notify candidate
    if (candidate.userId) {
      NotificationService.createNotification({
        organizationId,
        recipientId: candidate.userId,
        type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
        title: "Certificate Issued",
        message: `Congratulations! Your certificate for '${title}' has been issued. Certificate Number: ${certificateNumber}`,
        data: {
          certificateId: certificate._id,
          certificateNumber,
          verificationCode,
        },
      }).catch(() => {});
    }

    AuditLogService.createAuditLog({
      organizationId,
      actorId: issuerUser?._id || issuerUser || null,
      action: "CREATE",
      resource: "CERTIFICATE",
      resourceId: certificate._id,
      description: `Issued certificate '${certificateNumber}' to candidate '${candidate.email}' for assessment '${title}'`,
    }).catch(() => {});

    return certificate;
  }

  /**
   * Retrieves certificates for the currently authenticated candidate
   */
  static async getCandidateCertificates(organizationId, userId) {
    let candidate = await Candidate.findOne({ userId, status: "ACTIVE" });
    if (organizationId && (!candidate || candidate.organizationId.toString() !== organizationId.toString())) {
      candidate = await Candidate.findOne({ organizationId, userId, status: "ACTIVE" });
    }

    if (!candidate) {
      return [];
    }

    const filter = {
      candidateId: candidate._id,
      status: { $in: [CERTIFICATE_STATUSES.ISSUED, CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.EXPIRED] },
    };
    if (organizationId) filter.organizationId = organizationId;

    return Certificate.find(filter)
      .populate("assessmentId", "title code")
      .sort({ issuedAt: -1 });
  }

  /**
   * Retrieves all certificates in an organization with filters (Admin/Examiner)
   */
  static async getOrganizationCertificates(organizationId, query = {}) {
    const filter = { organizationId };

    if (query.status) filter.status = query.status;
    if (query.assessmentId && mongoose.Types.ObjectId.isValid(query.assessmentId)) {
      filter.assessmentId = query.assessmentId;
    }
    if (query.candidateId && mongoose.Types.ObjectId.isValid(query.candidateId)) {
      filter.candidateId = query.candidateId;
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Certificate.find(filter)
        .populate("candidateId", "firstName lastName email candidateCode")
        .populate("assessmentId", "title code")
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves details for a specific certificate
   */
  static async getCertificateDetails(organizationId, certificateId, userId = null, isCandidate = false) {
    if (!mongoose.Types.ObjectId.isValid(certificateId)) {
      throw new ApiError(400, "Invalid certificate ID format");
    }

    const filter = { _id: certificateId };
    if (organizationId) filter.organizationId = organizationId;

    const certificate = await Certificate.findOne(filter)
      .populate("candidateId", "firstName lastName email candidateCode userId")
      .populate("assessmentId", "title code")
      .lean();

    if (!certificate) {
      throw new ApiError(404, "Certificate not found");
    }

    if (isCandidate) {
      let candidate = await Candidate.findOne({ userId, status: "ACTIVE" });
      if (organizationId && (!candidate || candidate.organizationId.toString() !== organizationId.toString())) {
        candidate = await Candidate.findOne({ userId, organizationId, status: "ACTIVE" });
      }

      const certCandId = certificate.candidateId?._id
        ? certificate.candidateId._id.toString()
        : certificate.candidateId?.toString();

      if (!candidate || certCandId !== candidate._id.toString()) {
        throw new ApiError(403, "Access denied: You can only view your own certificates");
      }
    }

    return certificate;
  }

  /**
   * Revokes an existing certificate
   */
  static async revokeCertificate(organizationId, certificateId, userId, reason = "") {
    if (!mongoose.Types.ObjectId.isValid(certificateId)) {
      throw new ApiError(400, "Invalid certificate ID format");
    }

    const certificate = await Certificate.findOne({ _id: certificateId, organizationId });
    if (!certificate) {
      throw new ApiError(404, "Certificate not found");
    }

    if (certificate.status === CERTIFICATE_STATUSES.REVOKED) {
      throw new ApiError(400, "Certificate is already revoked");
    }

    certificate.status = CERTIFICATE_STATUSES.REVOKED;
    certificate.revokedAt = new Date();
    certificate.revokedBy = userId;
    certificate.revocationReason = reason || "Revoked by examination board";
    await certificate.save();

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "UPDATE",
      resource: "CERTIFICATE",
      resourceId: certificate._id,
      description: `Revoked certificate '${certificate.certificateNumber}' (Reason: ${certificate.revocationReason})`,
    }).catch(() => {});

    return certificate;
  }

  /**
   * Reissues a certificate by marking the previous one REVOKED and creating a new one
   */
  static async reissueCertificate(organizationId, certificateId, userId, reason = "") {
    if (!mongoose.Types.ObjectId.isValid(certificateId)) {
      throw new ApiError(400, "Invalid certificate ID format");
    }

    const oldCertificate = await Certificate.findOne({ _id: certificateId, organizationId });
    if (!oldCertificate) {
      throw new ApiError(404, "Certificate not found in this organization");
    }

    // Revoke old certificate if not already revoked
    if (oldCertificate.status !== CERTIFICATE_STATUSES.REVOKED) {
      oldCertificate.status = CERTIFICATE_STATUSES.REVOKED;
      oldCertificate.revokedAt = new Date();
      oldCertificate.revokedBy = userId;
      oldCertificate.revocationReason = reason || "Revoked for reissue";
      await oldCertificate.save();
    }

    // Generate fresh certificate with new identifiers
    const certificateNumber = await CertificateNumberService.generateCertificateNumber();
    const verificationCode = CertificateNumberService.generateVerificationCode();

    const [assessment, candidate, organization, result] = await Promise.all([
      Assessment.findById(oldCertificate.assessmentId).lean(),
      Candidate.findById(oldCertificate.candidateId).lean(),
      Organization.findById(organizationId).lean(),
      Result.findById(oldCertificate.resultId).lean(),
    ]);

    const recipientName = candidate ? `${candidate.firstName} ${candidate.lastName}`.trim() : oldCertificate.recipientName;
    const title = assessment?.title || oldCertificate.title;
    const issuerName = organization?.name || oldCertificate.issuerName;

    const generatedFile = await CertificateGenerator.generateCertificateFile({
      recipientName,
      certificateNumber,
      verificationCode,
      title,
      issuerName,
      issuedAt: new Date(),
      score: oldCertificate.score,
      percentage: oldCertificate.percentage,
      grade: oldCertificate.grade,
      templateId: oldCertificate.templateId || "MODERN",
    });

    const newCertificate = await Certificate.create({
      organizationId,
      certificateNumber,
      verificationCode,
      candidateId: oldCertificate.candidateId,
      assessmentId: oldCertificate.assessmentId,
      attemptId: oldCertificate.attemptId,
      resultId: oldCertificate.resultId,
      type: oldCertificate.type || "ASSESSMENT",
      title,
      description: `Reissued certificate for '${title}'.`,
      recipientName,
      issuedAt: new Date(),
      status: CERTIFICATE_STATUSES.ISSUED,
      score: oldCertificate.score,
      percentage: oldCertificate.percentage,
      grade: oldCertificate.grade,
      issuerName,
      issuerTitle: oldCertificate.issuerTitle,
      templateId: generatedFile.templateId,
      fileUrl: generatedFile.fileUrl,
      verificationUrl: generatedFile.verificationUrl,
      metadata: {
        reissuedFrom: oldCertificate._id,
        reissueReason: reason,
      },
    });

    AuditLogService.createAuditLog({
      organizationId,
      actorId: userId,
      action: "CREATE",
      resource: "CERTIFICATE",
      resourceId: newCertificate._id,
      description: `Reissued certificate '${newCertificate.certificateNumber}' replacing revoked '${oldCertificate.certificateNumber}'`,
    }).catch(() => {});

    return newCertificate;
  }
}
