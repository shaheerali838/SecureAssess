import { AuditLogService } from "./auditLog.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getAuditLogs = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;

  // If user is PLATFORM_OWNER/ADMIN querying without org, allow platform-wide logs
  const orgId = req.user?.platformRole === "PLATFORM_OWNER" || req.user?.platformRole === "PLATFORM_ADMIN"
    ? (req.query.organizationId || organizationId || null)
    : organizationId;

  const result = await AuditLogService.getAuditLogs(orgId, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Audit logs retrieved successfully"));
});

export const getAuditLogById = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { auditLogId } = req.params;

  const orgId = req.user?.platformRole === "PLATFORM_OWNER" || req.user?.platformRole === "PLATFORM_ADMIN"
    ? (req.query.organizationId || organizationId || null)
    : organizationId;

  const result = await AuditLogService.getAuditLogById(orgId, auditLogId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Audit log details retrieved successfully"));
});

export const getResourceAuditLogs = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { resource, resourceId } = req.params;

  const orgId = req.user?.platformRole === "PLATFORM_OWNER" || req.user?.platformRole === "PLATFORM_ADMIN"
    ? (req.query.organizationId || organizationId || null)
    : organizationId;

  const result = await AuditLogService.getResourceAuditLogs(
    orgId,
    resource.toUpperCase(),
    resourceId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Resource audit logs retrieved successfully"));
});

export const getUserAuditLogs = asyncHandler(async (req, res) => {
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const { userId } = req.params;

  const orgId = req.user?.platformRole === "PLATFORM_OWNER" || req.user?.platformRole === "PLATFORM_ADMIN"
    ? (req.query.organizationId || organizationId || null)
    : organizationId;

  const result = await AuditLogService.getUserAuditLogs(
    orgId,
    userId,
    req.query
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "User audit logs retrieved successfully"));
});

export const exportAuditLogs = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  const organizationId =
    req.params.organizationId ||
    req.organizationId ||
    req.query.organizationId ||
    req.headers["x-organization-id"] ||
    req.user?.activeOrganizationId;
  const format = (req.query.format || "CSV").toUpperCase();

  const orgId = req.user?.platformRole === "PLATFORM_OWNER" || req.user?.platformRole === "PLATFORM_ADMIN"
    ? (req.query.organizationId || organizationId || null)
    : organizationId;

  const result = await AuditLogService.exportAuditLogs(
    orgId,
    userId,
    req.query,
    format
  );

  if (format === "CSV") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit_logs_${Date.now()}.csv"`);
    return res.status(200).send(result);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Audit logs exported successfully"));
});
