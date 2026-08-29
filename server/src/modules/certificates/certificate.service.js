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
import { CERTIFICATE_STATUSES } from "./certificate.constants.js";
import { ApiError } from "../../utils/ApiError.js";

export class CertificateService {
  /**
   * Automatically issues a verifiable credential for a passed result
   */
  static async issueCertificateForResult(organizationId, resultId, issuerUser = null) {
    if (!mongoose.Types.ObjectId.isValid(resultId)) {
      throw new ApiError(400, "Invalid result ID format");
    }

    const result = await Result.findOne({ _id: resultId, organizationId }).lean();
    if (!result) {
      throw new ApiError(404, "Result not found in this organization");
    }

    if (!result.passed) {
      throw new ApiError(400, "Candidate is not eligible for a certificate: Result did not meet passing score criteria.");
    }

    // Idempotency: check if certificate already exists
    const existing = await Certificate.findOne({ resultId, organizationId });
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
      score: result.totalPoints ? result.earnedPoints : result.percentage,
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
      score: result.earnedPoints,
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
      await NotificationService.notify({
        organizationId,
        recipientId: candidate.userId,
        type: NOTIFICATION_TYPES.CERTIFICATE_ISSUED,
        data: {
          assessmentTitle: title,
          certificateNumber,
          verificationCode,
        },
      });
    }

    return certificate;
  }

  /**
   * Retrieves certificates for the currently authenticated candidate
   */
  static async getCandidateCertificates(organizationId, userId) {
    const candidate = await Candidate.findOne({ organizationId, userId });
    if (!candidate) {
      throw new ApiError(404, "Candidate profile not found in this organization");
    }

    return Certificate.find({
      organizationId,
      candidateId: candidate._id,
      status: { $in: [CERTIFICATE_STATUSES.ISSUED, CERTIFICATE_STATUSES.REVOKED, CERTIFICATE_STATUSES.EXPIRED] },
    })
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
        totalPages: Math.ceil(total / limit),
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

    const certificate = await Certificate.findOne({ _id: certificateId, organizationId })
      .populate("candidateId", "firstName lastName email candidateCode userId")
      .populate("assessmentId", "title code")
      .lean();

    if (!certificate) {
      throw new ApiError(404, "Certificate not found");
    }

    if (isCandidate && certificate.candidateId?.userId?.toString() !== userId?.toString()) {
      throw new ApiError(403, "Access denied: You can only view your own certificates");
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

    return certificate;
  }
}
