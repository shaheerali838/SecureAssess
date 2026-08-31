export const SECURITY_EVENT_TYPES = Object.freeze({
  FAILED_LOGIN_THRESHOLD: "FAILED_LOGIN_THRESHOLD",
  CROSS_TENANT_VIOLATION: "CROSS_TENANT_VIOLATION",
  ANTI_TAMPERING_VIOLATION: "ANTI_TAMPERING_VIOLATION",
  UNAUTHORIZED_ACCESS_SPIKE: "UNAUTHORIZED_ACCESS_SPIKE",
  UNUSUAL_CERTIFICATE_ACTIVITY: "UNUSUAL_CERTIFICATE_ACTIVITY",
  LARGE_DATA_EXPORT: "LARGE_DATA_EXPORT",
});

export const SECURITY_RULES = Object.freeze({
  FAILED_LOGIN: {
    threshold: 3,
    windowMinutes: 15,
    severity: "HIGH",
  },
  CROSS_TENANT: {
    threshold: 2,
    windowMinutes: 10,
    severity: "HIGH",
  },
  ANTI_TAMPERING: {
    threshold: 1,
    windowMinutes: 30,
    severity: "CRITICAL",
  },
  DATA_EXPORT_SPIKE: {
    threshold: 5,
    windowMinutes: 5,
    severity: "MEDIUM",
  },
});
