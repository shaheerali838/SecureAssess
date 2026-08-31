export const TENANT_INDUSTRIES = Object.freeze({
  ACADEMIC: "academic",
  CORPORATE: "corporate",
  AVIATION: "aviation",
  RECRUITMENT: "recruitment",
});

export const ORGANIZATION_TYPES = Object.freeze({
  UNIVERSITY: "UNIVERSITY",
  COLLEGE: "COLLEGE",
  SCHOOL: "SCHOOL",
  CORPORATE: "CORPORATE",
  TRAINING_INSTITUTE: "TRAINING_INSTITUTE",
  GOVERNMENT: "GOVERNMENT",
  NON_PROFIT: "NON_PROFIT",
  OTHER: "OTHER",
});

export const ORGANIZATION_STATUSES = Object.freeze({
  ACTIVE: "ACTIVE",
  TRIAL: "TRIAL",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED",
  DEACTIVATED: "DEACTIVATED",
});

export const ORGANIZATION_DEFAULTS = Object.freeze({
  TIMEZONE: "Asia/Karachi",
  LOCALE: "en",
  DATE_FORMAT: "YYYY-MM-DD",
  BRANDING: {
    primaryColor: "#4f46e5",
    secondaryColor: "#06b6d4",
  },
  ASSESSMENT_DEFAULTS: {
    durationMinutes: 60,
    passingPercentage: 60,
    allowCandidatePause: false,
    enforceFullscreen: true,
    trackTabSwitches: true,
    maxTabSwitchesAllowed: 3,
  },
});
