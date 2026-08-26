export const ORGANIZATION_TYPES = Object.freeze({
  UNIVERSITY: "UNIVERSITY",
  COMPANY: "COMPANY",
  TRAINING_INSTITUTE: "TRAINING_INSTITUTE",
  BOOTCAMP: "BOOTCAMP",
  OTHER: "OTHER",
});

export const ORGANIZATION_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  SUSPENDED: "SUSPENDED",
  DEACTIVATED: "DEACTIVATED",
});

export const ORGANIZATION_MESSAGES = Object.freeze({
  CREATED: "Organization registered successfully",
  RETRIEVED: "Organization details retrieved successfully",
  LIST_RETRIEVED: "Organizations list retrieved successfully",
  UPDATED: "Organization updated successfully",
  DEACTIVATED: "Organization deactivated successfully",
  NOT_FOUND: "Organization not found",
  SLUG_EXISTS: "Organization with this slug or domain already exists",
  SUBSCRIPTION_UPDATED: "Organization subscription updated successfully",
});

export const ORGANIZATION_DEFAULTS = Object.freeze({
  MAX_USERS: 50,
  MAX_ASSESSMENTS_PER_MONTH: 200,
  STORAGE_QUOTA_MB: 5120, // 5GB
  DEFAULT_PROCTORING: {
    enforceFullscreen: true,
    trackTabSwitches: true,
    enableWebcamSnapshot: true,
    enableScreenShare: true,
  },
});
