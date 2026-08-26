export const PERMISSIONS = Object.freeze({
  // User Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",

  // Organization
  ORG_MANAGE: "organization:manage",

  // Assessments
  ASSESSMENT_CREATE: "assessment:create",
  ASSESSMENT_READ: "assessment:read",
  ASSESSMENT_UPDATE: "assessment:update",
  ASSESSMENT_DELETE: "assessment:delete",
  ASSESSMENT_PUBLISH: "assessment:publish",

  // Question Bank
  QUESTION_CREATE: "question:create",
  QUESTION_READ: "question:read",
  QUESTION_UPDATE: "question:update",
  QUESTION_DELETE: "question:delete",

  // Attempts & Results
  ATTEMPT_SUBMIT: "attempt:submit",
  ATTEMPT_REVIEW: "attempt:review",
  RESULT_VIEW: "result:view",
  RESULT_EXPORT: "result:export",

  // Proctoring
  PROCTOR_SESSION: "proctor:session",
  PROCTOR_LOGS_VIEW: "proctor:logs_view",

  // System & Billing
  BILLING_MANAGE: "billing:manage",
  AUDIT_LOG_VIEW: "audit:view",
});
