import mongoose from "mongoose";
import AuditLog from "./auditLog.model.js";
import {
  ACTOR_TYPES,
  AUDIT_SCOPES,
  AUDIT_STATUSES,
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
} from "./auditLog.constants.js";
import { ApiError } from "../../utils/ApiError.js";
import { NotificationService } from "../notifications/notification.service.js";
import { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS, NOTIFICATION_PRIORITIES } from "../notifications/notification.constants.js";

const SENSITIVE_KEYS = [
  "password",
  "passwordhash",
  "refreshtoken",
  "accesstoken",
  "token",
  "secret",
  "authorization",
  "cookie",
  "jwt",
  "key",
  "privatekey",
  "cardnumber",
  "cvv",
];

const sanitizeMetadata = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeMetadata);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk))) {
      clean[key] = "[REDACTED]";
    } else if (val && typeof val === "object" && !(val instanceof Date) && !(val instanceof mongoose.Types.ObjectId)) {
      clean[key] = sanitizeMetadata(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

export class AuditLogService {
  /**
   * 1. Core Audit Log Recorder
   */
  static async createAuditLog({
    organizationId = null,
    actorId = null,
    actorType = ACTOR_TYPES.USER,
    action,
    resource,
    resourceId = null,
    scope = null,
    description,
    metadata = {},
    ipAddress = null,
    userAgent = null,
    requestId = null,
    status = AUDIT_STATUSES.SUCCESS,
    errorCode = null,
  }) {
    if (!action || !resource || !description) {
      throw new ApiError(400, "action, resource, and description are required for audit logging");
    }

    const resolvedScope =
      scope ||
      (actorType === ACTOR_TYPES.SYSTEM
        ? AUDIT_SCOPES.SYSTEM
        : organizationId
        ? AUDIT_SCOPES.ORGANIZATION
        : AUDIT_SCOPES.PLATFORM);

    const safeMeta = sanitizeMetadata(metadata);

    const log = await AuditLog.create({
      organizationId: organizationId ? (mongoose.Types.ObjectId.isValid(organizationId) ? new mongoose.Types.ObjectId(organizationId) : organizationId) : null,
      actorId: actorId ? (mongoose.Types.ObjectId.isValid(actorId) ? new mongoose.Types.ObjectId(actorId) : actorId) : null,
      actorType,
      action,
      resource,
      resourceId: resourceId ? resourceId.toString() : null,
      scope: resolvedScope,
      description,
      metadata: safeMeta,
      ipAddress,
      userAgent,
      requestId,
      status,
      errorCode,
    });

    return log;
  }

  /**
   * 2. System / Automated Job Audit Recorder
   */
  static async createSystemAuditLog({
    organizationId = null,
    action,
    resource,
    resourceId = null,
    description,
    metadata = {},
    status = AUDIT_STATUSES.SUCCESS,
  }) {
    return this.createAuditLog({
      organizationId,
      actorId: null,
      actorType: ACTOR_TYPES.SYSTEM,
      action,
      resource,
      resourceId,
      scope: organizationId ? AUDIT_SCOPES.ORGANIZATION : AUDIT_SCOPES.SYSTEM,
      description,
      metadata,
      status,
    });
  }

  /**
   * 3. Security Event Audit Recorder with Alert Integration
   */
  static async createSecurityAuditLog({
    organizationId = null,
    actorId = null,
    action = AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
    resource = AUDIT_RESOURCES.SECURITY,
    resourceId = null,
    description,
    metadata = {},
    ipAddress = null,
    userAgent = null,
    requestId = null,
    status = AUDIT_STATUSES.WARNING,
    errorCode = null,
    sendAlert = false,
  }) {
    const log = await this.createAuditLog({
      organizationId,
      actorId,
      actorType: ACTOR_TYPES.USER,
      action,
      resource,
      resourceId,
      scope: organizationId ? AUDIT_SCOPES.ORGANIZATION : AUDIT_SCOPES.PLATFORM,
      description,
      metadata,
      ipAddress,
      userAgent,
      requestId,
      status,
      errorCode,
    });

    // Send Security Notification for critical events
    if (sendAlert && actorId) {
      try {
        await NotificationService.createNotification({
          userId: actorId,
          organizationId,
          type: NOTIFICATION_TYPES.SECURITY_ALERT,
          title: "Critical Security Event Detected",
          message: description,
          channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
          priority: NOTIFICATION_PRIORITIES.URGENT,
          metadata: { action, ipAddress, requestId },
        });
      } catch (err) {
        console.warn("[AuditLogService] Security notification dispatch failed:", err.message);
      }
    }

    return log;
  }

  /**
   * 4. Query Audit Logs with Filtering, Searching, & Pagination
   */
  static async getAuditLogs(organizationId = null, query = {}) {
    const filter = {};

    if (organizationId) {
      filter.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    if (query.actorId) {
      filter.actorId = new mongoose.Types.ObjectId(query.actorId);
    }
    if (query.actorType) {
      filter.actorType = query.actorType;
    }
    if (query.action) {
      filter.action = query.action;
    }
    if (query.resource) {
      filter.resource = query.resource;
    }
    if (query.resourceId) {
      filter.resourceId = query.resourceId;
    }
    if (query.scope) {
      filter.scope = query.scope;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.requestId) {
      filter.requestId = query.requestId;
    }

    if (query.search) {
      filter.$or = [
        { description: { $regex: query.search, $options: "i" } },
        { requestId: { $regex: query.search, $options: "i" } },
        { errorCode: { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actorId", "firstName lastName email avatar platformRole")
        .populate("organizationId", "name code slug")
        .lean(),
      AuditLog.countDocuments(filter),
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
   * 5. Get Resource-specific Audit Logs
   */
  static async getResourceAuditLogs(organizationId, resource, resourceId, query = {}) {
    return this.getAuditLogs(organizationId, {
      ...query,
      resource,
      resourceId,
    });
  }

  /**
   * 6. Get User-specific Audit Logs
   */
  static async getUserAuditLogs(organizationId, userId, query = {}) {
    return this.getAuditLogs(organizationId, {
      ...query,
      actorId: userId,
    });
  }

  /**
   * 7. Get Single Audit Log Details
   */
  static async getAuditLogById(organizationId, auditLogId) {
    if (!mongoose.Types.ObjectId.isValid(auditLogId)) {
      throw new ApiError(400, "Invalid audit log ID format");
    }

    const filter = { _id: auditLogId };
    if (organizationId) {
      filter.organizationId = organizationId;
    }

    const log = await AuditLog.findOne(filter)
      .populate("actorId", "firstName lastName email avatar platformRole")
      .populate("organizationId", "name code slug");

    if (!log) {
      throw new ApiError(404, "Audit log record not found");
    }

    return log;
  }

  /**
   * 8. Export Audit Logs (CSV / JSON) & Self-Audit the Export Action
   */
  static async exportAuditLogs(organizationId, userId, filters = {}, format = "CSV") {
    const logsData = await this.getAuditLogs(organizationId, { ...filters, limit: 1000 });
    const items = logsData.items || [];

    // Audit the export action itself
    await this.createAuditLog({
      organizationId,
      actorId: userId,
      action: AUDIT_ACTIONS.EXPORT,
      resource: AUDIT_RESOURCES.AUDIT_LOG,
      description: `Exported ${items.length} audit logs in ${format.toUpperCase()} format`,
      metadata: { filters, count: items.length, format },
    });

    if (format.toUpperCase() === "CSV") {
      const headers = ["Timestamp", "Action", "Resource", "Resource ID", "Actor Email", "Status", "IP Address", "Request ID", "Description"];
      const rows = items.map((i) => [
        `"${i.createdAt ? new Date(i.createdAt).toISOString() : ""}"`,
        `"${i.action || ""}"`,
        `"${i.resource || ""}"`,
        `"${i.resourceId || ""}"`,
        `"${i.actorId?.email || i.actorType || ""}"`,
        `"${i.status || ""}"`,
        `"${i.ipAddress || ""}"`,
        `"${i.requestId || ""}"`,
        `"${(i.description || "").replace(/"/g, '""')}"`,
      ]);

      return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }

    return items;
  }
}
