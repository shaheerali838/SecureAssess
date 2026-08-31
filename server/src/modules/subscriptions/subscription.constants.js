export const SUBSCRIPTION_STATUSES = Object.freeze({
  TRIALING: "TRIALING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  PAUSED: "PAUSED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
});

export const SUBSCRIPTION_STATUS_LIST = Object.values(SUBSCRIPTION_STATUSES);

export const BILLING_INTERVALS = Object.freeze({
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
});

export const BILLING_INTERVAL_LIST = Object.values(BILLING_INTERVALS);

export const PLAN_STATUSES = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
});

export const PLAN_STATUS_LIST = Object.values(PLAN_STATUSES);

export const DEFAULT_PLANS = Object.freeze({
  FREE: {
    name: "Free Starter",
    code: "FREE",
    description: "Ideal for small teams and initial evaluation.",
    price: 0,
    currency: "USD",
    billingInterval: "MONTHLY",
    limits: {
      maxUsers: 2,
      maxCandidates: 20,
      maxAssessments: 3,
      maxQuestions: 50,
      maxAttempts: 50,
      maxInterviews: 2,
      maxStorage: 1, // GB
    },
    features: {
      assessmentBuilder: true,
      advancedQuestionBank: false,
      proctoring: false,
      liveInterviews: false,
      analytics: false,
      certificates: false,
      customBranding: false,
      exports: true,
      apiAccess: false,
    },
    status: "ACTIVE",
    isPublic: true,
    sortOrder: 1,
  },
  STARTER: {
    name: "Starter Academic",
    code: "STARTER",
    description: "Designed for small departments, classrooms, and testing centers.",
    price: 49,
    currency: "USD",
    billingInterval: "MONTHLY",
    limits: {
      maxUsers: 5,
      maxCandidates: 200,
      maxAssessments: 15,
      maxQuestions: 500,
      maxAttempts: 500,
      maxInterviews: 20,
      maxStorage: 10,
    },
    features: {
      assessmentBuilder: true,
      advancedQuestionBank: true,
      proctoring: false,
      liveInterviews: true,
      analytics: true,
      certificates: true,
      customBranding: false,
      exports: true,
      apiAccess: false,
    },
    status: "ACTIVE",
    isPublic: true,
    sortOrder: 2,
  },
  PROFESSIONAL: {
    name: "Professional Institution",
    code: "PROFESSIONAL",
    description: "Comprehensive exam delivery with AI proctoring and live interview assessment.",
    price: 199,
    currency: "USD",
    billingInterval: "MONTHLY",
    limits: {
      maxUsers: 25,
      maxCandidates: 2000,
      maxAssessments: 100,
      maxQuestions: 5000,
      maxAttempts: 5000,
      maxInterviews: 200,
      maxStorage: 100,
    },
    features: {
      assessmentBuilder: true,
      advancedQuestionBank: true,
      proctoring: true,
      liveInterviews: true,
      analytics: true,
      certificates: true,
      customBranding: true,
      exports: true,
      apiAccess: true,
    },
    status: "ACTIVE",
    isPublic: true,
    sortOrder: 3,
  },
  ENTERPRISE: {
    name: "Enterprise University / Corporate",
    code: "ENTERPRISE",
    description: "Unlimited scale, dedicated governance, custom limits, and full white-labeling.",
    price: 999,
    currency: "USD",
    billingInterval: "MONTHLY",
    limits: {
      maxUsers: -1,
      maxCandidates: -1,
      maxAssessments: -1,
      maxQuestions: -1,
      maxAttempts: -1,
      maxInterviews: -1,
      maxStorage: -1,
    },
    features: {
      assessmentBuilder: true,
      advancedQuestionBank: true,
      proctoring: true,
      liveInterviews: true,
      analytics: true,
      certificates: true,
      customBranding: true,
      exports: true,
      apiAccess: true,
    },
    status: "ACTIVE",
    isPublic: true,
    sortOrder: 4,
  },
});
