import mongoose from "mongoose";
import {
  ACTOR_TYPES,
  ACTOR_TYPE_LIST,
  AUDIT_SCOPES,
  AUDIT_SCOPE_LIST,
  AUDIT_STATUSES,
  AUDIT_STATUS_LIST,
  AUDIT_ACTIONS,
  AUDIT_ACTION_LIST,
  AUDIT_RESOURCES,
  AUDIT_RESOURCE_LIST,
} from "./auditLog.constants.js";

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    actorType: {
      type: String,
      enum: ACTOR_TYPE_LIST,
      default: ACTOR_TYPES.USER,
      required: true,
    },
    action: {
      type: String,
      enum: AUDIT_ACTION_LIST,
      required: [true, "Audit action is required"],
      index: true,
    },
    resource: {
      type: String,
      enum: AUDIT_RESOURCE_LIST,
      required: [true, "Audit resource is required"],
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    scope: {
      type: String,
      enum: AUDIT_SCOPE_LIST,
      default: AUDIT_SCOPES.ORGANIZATION,
      required: true,
    },
    description: {
      type: String,
      required: [true, "Audit description is required"],
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
      trim: true,
    },
    userAgent: {
      type: String,
      default: null,
      trim: true,
    },
    requestId: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: AUDIT_STATUS_LIST,
      default: AUDIT_STATUSES.SUCCESS,
      required: true,
    },
    errorCode: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Indexes
auditLogSchema.index({ organizationId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ requestId: 1 });

// Immutability Guards: Disallow updates and deletions to preserve tamper-evident audit trails
const blockMutation = function () {
  const options = this.getOptions ? this.getOptions() : {};
  if (options.bypassImmutability) {
    return;
  }
  const err = new Error("Audit logs are append-only and immutable. Modifications and deletions are strictly prohibited.");
  err.statusCode = 403;
  throw err;
};

auditLogSchema.pre("updateOne", blockMutation);
auditLogSchema.pre("updateMany", blockMutation);
auditLogSchema.pre("findOneAndUpdate", blockMutation);
auditLogSchema.pre("deleteOne", blockMutation);
auditLogSchema.pre("deleteMany", blockMutation);
auditLogSchema.pre("findOneAndDelete", blockMutation);

const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
