import {
  ACTOR_TYPE_LIST,
  AUDIT_SCOPE_LIST,
  AUDIT_STATUS_LIST,
  AUDIT_ACTION_LIST,
  AUDIT_RESOURCE_LIST,
} from "./auditLog.constants.js";

export const queryAuditLogsSchema = {
  validate: (query = {}) => {
    const errors = [];
    if (query.actorType && !ACTOR_TYPE_LIST.includes(query.actorType)) {
      errors.push({ message: `actorType must be one of: ${ACTOR_TYPE_LIST.join(", ")}` });
    }
    if (query.action && !AUDIT_ACTION_LIST.includes(query.action)) {
      errors.push({ message: `action must be one of: ${AUDIT_ACTION_LIST.join(", ")}` });
    }
    if (query.resource && !AUDIT_RESOURCE_LIST.includes(query.resource)) {
      errors.push({ message: `resource must be one of: ${AUDIT_RESOURCE_LIST.join(", ")}` });
    }
    if (query.scope && !AUDIT_SCOPE_LIST.includes(query.scope)) {
      errors.push({ message: `scope must be one of: ${AUDIT_SCOPE_LIST.join(", ")}` });
    }
    if (query.status && !AUDIT_STATUS_LIST.includes(query.status)) {
      errors.push({ message: `status must be one of: ${AUDIT_STATUS_LIST.join(", ")}` });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: query,
    };
  },
};

export const exportAuditLogsSchema = {
  validate: (query = {}) => {
    const errors = [];
    if (query.format && !["CSV", "PDF", "JSON"].includes(query.format.toUpperCase())) {
      errors.push({ message: "format must be one of: CSV, PDF, JSON" });
    }
    return {
      error: errors.length ? { details: errors } : null,
      value: query,
    };
  },
};
