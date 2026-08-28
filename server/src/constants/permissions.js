export const PERMISSIONS = Object.freeze({
  // --- Platform Permissions (PLATFORM Scope) ---
  PLATFORM_VIEW: "platform.view",
  PLATFORM_SETTINGS_MANAGE: "platform.settings.manage",
  PLATFORM_ANALYTICS_VIEW: "platform.analytics.view",
  PLATFORM_MONITORING_VIEW: "platform.monitoring.view",

  ORGANIZATIONS_CREATE: "organizations.create",
  ORGANIZATIONS_VIEW: "organizations.view",
  ORGANIZATIONS_UPDATE: "organizations.update",
  ORGANIZATIONS_SUSPEND: "organizations.suspend",
  ORGANIZATIONS_DELETE: "organizations.delete",

  PLATFORM_USERS_CREATE: "platform_users.create",
  PLATFORM_USERS_VIEW: "platform_users.view",
  PLATFORM_USERS_UPDATE: "platform_users.update",
  PLATFORM_USERS_SUSPEND: "platform_users.suspend",

  ROLES_CREATE: "roles.create",
  ROLES_VIEW: "roles.view",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  PERMISSIONS_VIEW: "permissions.view",
  PERMISSIONS_MANAGE: "permissions.manage",

  SUBSCRIPTIONS_VIEW: "subscriptions.view",
  SUBSCRIPTIONS_MANAGE: "subscriptions.manage",

  BILLING_VIEW: "billing.view",
  BILLING_MANAGE: "billing.manage",

  SYSTEM_CONFIG_VIEW: "system_configuration.view",
  SYSTEM_CONFIG_MANAGE: "system_configuration.manage",

  // --- Organization Permissions (ORGANIZATION Scope) ---
  ORG_PROFILE_VIEW: "organizations.profile.view",
  ORG_PROFILE_UPDATE: "organizations.profile.update",

  ORG_USERS_CREATE: "organization_users.create",
  ORG_USERS_VIEW: "organization_users.view",
  ORG_USERS_UPDATE: "organization_users.update",
  ORG_USERS_SUSPEND: "organization_users.suspend",
  ORG_USERS_REMOVE: "organization_users.remove",

  DEPARTMENTS_CREATE: "departments.create",
  DEPARTMENTS_VIEW: "departments.view",
  DEPARTMENTS_UPDATE: "departments.update",
  DEPARTMENTS_DELETE: "departments.delete",

  PROGRAMS_CREATE: "programs.create",
  PROGRAMS_VIEW: "programs.view",
  PROGRAMS_UPDATE: "programs.update",
  PROGRAMS_DELETE: "programs.delete",

  SUBJECTS_CREATE: "subjects.create",
  SUBJECTS_VIEW: "subjects.view",
  SUBJECTS_UPDATE: "subjects.update",
  SUBJECTS_DELETE: "subjects.delete",

  // --- Candidate Permissions ---
  CANDIDATES_CREATE: "candidates.create",
  CANDIDATES_VIEW: "candidates.view",
  CANDIDATES_UPDATE: "candidates.update",
  CANDIDATES_DELETE: "candidates.delete",

  CANDIDATE_GROUPS_CREATE: "candidate_groups.create",
  CANDIDATE_GROUPS_VIEW: "candidate_groups.view",
  CANDIDATE_GROUPS_UPDATE: "candidate_groups.update",
  CANDIDATE_GROUPS_DELETE: "candidate_groups.delete",

  // --- Question Bank Permissions ---
  QUESTION_BANKS_CREATE: "question_banks.create",
  QUESTION_BANKS_VIEW: "question_banks.view",
  QUESTION_BANKS_UPDATE: "question_banks.update",
  QUESTION_BANKS_DELETE: "question_banks.delete",

  QUESTIONS_CREATE: "questions.create",
  QUESTIONS_VIEW: "questions.view",
  QUESTIONS_UPDATE: "questions.update",
  QUESTIONS_DELETE: "questions.delete",
  QUESTIONS_PUBLISH: "questions.publish",

  QUESTION_CATEGORIES_CREATE: "question_categories.create",
  QUESTION_CATEGORIES_VIEW: "question_categories.view",
  QUESTION_CATEGORIES_UPDATE: "question_categories.update",
  QUESTION_CATEGORIES_DELETE: "question_categories.delete",

  QUESTION_TAGS_CREATE: "question_tags.create",
  QUESTION_TAGS_VIEW: "question_tags.view",
  QUESTION_TAGS_UPDATE: "question_tags.update",
  QUESTION_TAGS_DELETE: "question_tags.delete",

  // --- Assessment Permissions ---
  ASSESSMENTS_CREATE: "assessments.create",
  ASSESSMENTS_VIEW: "assessments.view",
  ASSESSMENTS_UPDATE: "assessments.update",
  ASSESSMENTS_DELETE: "assessments.delete",
  ASSESSMENTS_PUBLISH: "assessments.publish",
  ASSESSMENTS_ARCHIVE: "assessments.archive",

  ASSESSMENT_SECTIONS_CREATE: "assessment_sections.create",
  ASSESSMENT_SECTIONS_VIEW: "assessment_sections.view",
  ASSESSMENT_SECTIONS_UPDATE: "assessment_sections.update",
  ASSESSMENT_SECTIONS_DELETE: "assessment_sections.delete",

  ASSESSMENT_QUESTIONS_ADD: "assessment_questions.add",
  ASSESSMENT_QUESTIONS_VIEW: "assessment_questions.view",
  ASSESSMENT_QUESTIONS_UPDATE: "assessment_questions.update",
  ASSESSMENT_QUESTIONS_REMOVE: "assessment_questions.remove",

  ASSESSMENT_ASSIGNMENTS_CREATE: "assessment_assignments.create",
  ASSESSMENT_ASSIGNMENTS_VIEW: "assessment_assignments.view",
  ASSESSMENT_ASSIGNMENTS_UPDATE: "assessment_assignments.update",
  ASSESSMENT_ASSIGNMENTS_CANCEL: "assessment_assignments.cancel",

  // --- Attempt Permissions ---
  ATTEMPTS_CREATE: "attempts.create",
  ATTEMPTS_VIEW: "attempts.view",
  ATTEMPTS_UPDATE: "attempts.update",
  ATTEMPTS_SUBMIT: "attempts.submit",
  ATTEMPTS_VIEW_OWN: "attempts.view_own",
  ATTEMPTS_UPDATE_OWN: "attempts.update_own",
  ATTEMPTS_SUBMIT_OWN: "attempts.submit_own",

  // --- Proctoring Permissions ---
  PROCTORING_VIEW: "proctoring.view",
  PROCTORING_MONITOR: "proctoring.monitor",
  PROCTORING_REVIEW: "proctoring.review",
  PROCTORING_FLAG: "proctoring.flag",
  PROCTORING_RESOLVE: "proctoring.resolve",

  // --- Evaluation Permissions ---
  EVALUATIONS_CREATE: "evaluations.create",
  EVALUATIONS_VIEW: "evaluations.view",
  EVALUATIONS_UPDATE: "evaluations.update",
  EVALUATIONS_SUBMIT: "evaluations.submit",
  EVALUATIONS_APPROVE: "evaluations.approve",
  EVALUATIONS_VIEW_OWN: "evaluations.view_own",

  // --- Results Permissions ---
  RESULTS_VIEW: "results.view",
  RESULTS_GENERATE: "results.generate",
  RESULTS_PUBLISH: "results.publish",
  RESULTS_EXPORT: "results.export",
  RESULTS_VIEW_OWN: "results.view_own",

  // --- Certificate Permissions ---
  CERTIFICATES_GENERATE: "certificates.generate",
  CERTIFICATES_VIEW: "certificates.view",
  CERTIFICATES_REVOKE: "certificates.revoke",
  CERTIFICATES_EXPORT: "certificates.export",
  CERTIFICATES_VIEW_OWN: "certificates.view_own",

  // --- Reports Permissions ---
  REPORTS_VIEW: "reports.view",
  REPORTS_GENERATE: "reports.generate",
  REPORTS_EXPORT: "reports.export",
  REPORTS_VIEW_OWN: "reports.view_own",

  // --- Audit Logs Permissions ---
  AUDIT_LOGS_VIEW: "audit_logs.view",
  AUDIT_LOGS_EXPORT: "audit_logs.export",
});

export const PERMISSION_LIST = Object.values(PERMISSIONS);
