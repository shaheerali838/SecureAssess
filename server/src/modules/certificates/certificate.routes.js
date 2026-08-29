import express from "express";
import {
  verifyPublicCertificate,
  issueCertificate,
  getMyCertificates,
  getOrganizationCertificates,
  getCertificateDetails,
  downloadCertificate,
  revokeCertificate,
} from "./certificate.controller.js";
import {
  issueCertificateSchema,
  revokeCertificateSchema,
} from "./certificate.validation.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireTenantContext } from "../../middleware/tenant.middleware.js";
import { requireOrganizationOrPlatformPermission } from "../../middleware/permission.middleware.js";
import { PERMISSIONS } from "../../constants/permissions.js";

const router = express.Router({ mergeParams: true });

// --- Candidate Self-Service Routes ---
router.get(
  "/candidate/certificates",
  requireAuth,
  requireTenantContext,
  getMyCertificates
);

// --- Organization Certificate Management Endpoints ---

// GET /api/v1/organizations/:organizationId/certificates
router.get(
  "/certificates",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_VIEW,
    PERMISSIONS.CERTIFICATES_VIEW
  ),
  getOrganizationCertificates
);

// POST /api/v1/organizations/:organizationId/certificates
router.post(
  "/certificates",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_GENERATE,
    PERMISSIONS.CERTIFICATES_GENERATE
  ),
  validateRequest(issueCertificateSchema),
  issueCertificate
);

// GET /api/v1/organizations/:organizationId/certificates/:certificateId
router.get(
  "/certificates/:certificateId",
  requireAuth,
  requireTenantContext,
  getCertificateDetails
);

// GET /api/v1/organizations/:organizationId/certificates/:certificateId/download
router.get(
  "/certificates/:certificateId/download",
  requireAuth,
  requireTenantContext,
  downloadCertificate
);

// PATCH /api/v1/organizations/:organizationId/certificates/:certificateId/revoke
router.patch(
  "/certificates/:certificateId/revoke",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_REVOKE,
    PERMISSIONS.CERTIFICATES_REVOKE
  ),
  validateRequest(revokeCertificateSchema),
  revokeCertificate
);

export default router;
