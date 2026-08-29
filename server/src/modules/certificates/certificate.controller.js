import { CertificateService } from "./certificate.service.js";
import { VerificationService } from "./verification.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const verifyPublicCertificate = asyncHandler(async (req, res) => {
  const { verificationCode } = req.params;
  const result = await VerificationService.verifyCertificate(verificationCode);

  const statusCode = result.valid ? 200 : 404;
  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, result, result.message));
});

export const issueCertificate = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { resultId } = req.body;

  const result = await CertificateService.issueCertificateForResult(
    organizationId,
    resultId,
    userId
  );

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Certificate issued successfully"));
});

export const getMyCertificates = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;

  const result = await CertificateService.getCandidateCertificates(
    organizationId,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Candidate certificates retrieved"));
});

export const getOrganizationCertificates = asyncHandler(async (req, res) => {
  const organizationId = req.params.organizationId || req.organizationId;
  const result = await CertificateService.getOrganizationCertificates(
    organizationId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Organization certificates retrieved"));
});

export const getCertificateDetails = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { certificateId } = req.params;

  const result = await CertificateService.getCertificateDetails(
    organizationId,
    certificateId,
    userId
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Certificate details retrieved"));
});

export const downloadCertificate = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { certificateId } = req.params;

  const result = await CertificateService.getCertificateDetails(
    organizationId,
    certificateId,
    userId
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          fileUrl: result.fileUrl,
          certificateNumber: result.certificateNumber,
          recipientName: result.recipientName,
        },
        "Certificate download link ready"
      )
    );
});

export const revokeCertificate = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId = req.params.organizationId || req.organizationId;
  const { certificateId } = req.params;
  const { reason } = req.body;

  const result = await CertificateService.revokeCertificate(
    organizationId,
    certificateId,
    userId,
    reason
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Certificate revoked successfully"));
});
