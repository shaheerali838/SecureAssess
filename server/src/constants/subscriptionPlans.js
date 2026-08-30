export const SUBSCRIPTION_PLANS = Object.freeze({
  FREE_TRIAL: "FREE_TRIAL",
  STARTER: "STARTER",
  PROFESSIONAL: "PROFESSIONAL",
  ENTERPRISE: "ENTERPRISE",
  CUSTOM: "CUSTOM",
});

export const SUBSCRIPTION_PLAN_LIST = Object.values(SUBSCRIPTION_PLANS);

export const SUBSCRIPTION_STATUSES = Object.freeze({
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  SUSPENDED: "SUSPENDED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
});

export const SUBSCRIPTION_STATUS_LIST = Object.values(SUBSCRIPTION_STATUSES);

export const PLAN_CONFIGURATIONS = Object.freeze({
  [SUBSCRIPTION_PLANS.FREE_TRIAL]: {
    name: "Free 14-Day Trial",
    trialDays: 14,
    limits: {
      candidates: 25,
      assessments: 5,
      activeAssessments: 2,
      staffUsers: 3,
      interviews: 5,
      monthlyAttempts: 50,
      storageGb: 1,
    },
    features: {
      proctoring: false,
      liveInterviews: true,
      customCertificates: false,
      apiAccess: false,
      prioritySupport: false,
      whiteLabeling: false,
    },
  },
  [SUBSCRIPTION_PLANS.STARTER]: {
    name: "Starter Plan",
    limits: {
      candidates: 200,
      assessments: 20,
      activeAssessments: 10,
      staffUsers: 10,
      interviews: 30,
      monthlyAttempts: 500,
      storageGb: 10,
    },
    features: {
      proctoring: false,
      liveInterviews: true,
      customCertificates: true,
      apiAccess: false,
      prioritySupport: false,
      whiteLabeling: false,
    },
  },
  [SUBSCRIPTION_PLANS.PROFESSIONAL]: {
    name: "Professional Plan",
    limits: {
      candidates: 2000,
      assessments: 100,
      activeAssessments: 50,
      staffUsers: 50,
      interviews: 300,
      monthlyAttempts: 5000,
      storageGb: 50,
    },
    features: {
      proctoring: true,
      liveInterviews: true,
      customCertificates: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabeling: false,
    },
  },
  [SUBSCRIPTION_PLANS.ENTERPRISE]: {
    name: "Enterprise Plan",
    limits: {
      candidates: 50000,
      assessments: -1, // -1 denotes unlimited
      activeAssessments: -1,
      staffUsers: -1,
      interviews: -1,
      monthlyAttempts: -1,
      storageGb: 500,
    },
    features: {
      proctoring: true,
      liveInterviews: true,
      customCertificates: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabeling: true,
    },
  },
  [SUBSCRIPTION_PLANS.CUSTOM]: {
    name: "Custom Enterprise Plan",
    limits: {
      candidates: 100000,
      assessments: -1,
      activeAssessments: -1,
      staffUsers: -1,
      interviews: -1,
      monthlyAttempts: -1,
      storageGb: 1000,
    },
    features: {
      proctoring: true,
      liveInterviews: true,
      customCertificates: true,
      apiAccess: true,
      prioritySupport: true,
      whiteLabeling: true,
    },
  },
});
