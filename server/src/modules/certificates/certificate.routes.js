import express from "express";
import {
  verifyPublicCertificate,
  issueCertificate,
  getMyCertificates,
  getOrganizationCertificates,
  getCertificateDetails,
  downloadCertificate,
  revokeCertificate,
  reissueCertificate,
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
  "/my",
  requireAuth,
  requireTenantContext,
  getMyCertificates
);

router.get(
  "/candidate/certificates",
  requireAuth,
  requireTenantContext,
  getMyCertificates
);

router.get(
  "/candidate-portal/certificates",
  requireAuth,
  requireTenantContext,
  getMyCertificates
);

router.get(
  "/candidate-portal/certificates/:certificateId",
  requireAuth,
  requireTenantContext,
  getCertificateDetails
);

router.get(
  "/candidate-portal/certificates/:certificateId/download",
  requireAuth,
  requireTenantContext,
  downloadCertificate
);

// --- Organization Certificate Management Endpoints ---

// GET / - List certificates for organization
router.get(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_VIEW,
    PERMISSIONS.CERTIFICATES_VIEW
  ),
  getOrganizationCertificates
);

// GET /certificates - Alias
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

// POST / - Issue certificate
router.post(
  "/",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_GENERATE,
    PERMISSIONS.CERTIFICATES_GENERATE
  ),
  validateRequest(issueCertificateSchema),
  issueCertificate
);

// POST /certificates - Alias
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

// GET /:certificateId - View certificate
router.get(
  "/:certificateId",
  requireAuth,
  requireTenantContext,
  getCertificateDetails
);

// GET /certificates/:certificateId - Alias
router.get(
  "/certificates/:certificateId",
  requireAuth,
  requireTenantContext,
  getCertificateDetails
);

// GET /:certificateId/download - Download certificate
router.get(
  "/:certificateId/download",
  requireAuth,
  requireTenantContext,
  downloadCertificate
);

// GET /certificates/:certificateId/download - Alias
router.get(
  "/certificates/:certificateId/download",
  requireAuth,
  requireTenantContext,
  downloadCertificate
);

// PATCH /:certificateId/revoke - Revoke certificate
router.patch(
  "/:certificateId/revoke",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_REVOKE,
    PERMISSIONS.CERTIFICATES_REVOKE
  ),
  validateRequest(revokeCertificateSchema),
  revokeCertificate
);

// POST /:certificateId/revoke - Alias
router.post(
  "/:certificateId/revoke",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_REVOKE,
    PERMISSIONS.CERTIFICATES_REVOKE
  ),
  validateRequest(revokeCertificateSchema),
  revokeCertificate
);

// POST /:certificateId/reissue - Reissue certificate
router.post(
  "/:certificateId/reissue",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_GENERATE,
    PERMISSIONS.CERTIFICATES_GENERATE
  ),
  reissueCertificate
);

// POST /certificates/:certificateId/reissue - Alias
router.post(
  "/certificates/:certificateId/reissue",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PERMISSIONS.CERTIFICATES_GENERATE,
    PERMISSIONS.CERTIFICATES_GENERATE
  ),
  reissueCertificate
);

export default router;
