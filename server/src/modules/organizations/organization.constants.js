export const ORGANIZATION_TYPES = Object.freeze({
  UNIVERSITY: "UNIVERSITY",
  COLLEGE: "COLLEGE",
  SCHOOL: "SCHOOL",
  CORPORATE: "CORPORATE",
  TRAINING_INSTITUTE: "TRAINING_INSTITUTE",
  GOVERNMENT: "GOVERNMENT",
  OTHER: "OTHER",
});

export const ORGANIZATION_STATUSES = Object.freeze({
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED",
  DEACTIVATED: "DEACTIVATED",
});

export const ORGANIZATION_DEFAULTS = Object.freeze({
  TIMEZONE: "UTC",
  LOCALE: "en-US",
  DATE_FORMAT: "YYYY-MM-DD",
  BRANDING: {
    primaryColor: "#4f46e5",
    secondaryColor: "#06b6d4",
  },
  ASSESSMENT_DEFAULTS: {
    durationMinutes: 60,
    passingPercentage: 60,
    enforceFullscreen: true,
    trackTabSwitches: true,
    maxTabSwitchesAllowed: 3,
  },
});
