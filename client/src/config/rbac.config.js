import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "@/constants/roles";

export const ROLES = Object.freeze({
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
  ORGANIZATION_OWNER: "ORGANIZATION_OWNER",
  ORGANIZATION_ADMIN: "ORGANIZATION_ADMIN",
  EXAMINER: "EXAMINER",
  PROCTOR: "PROCTOR",
  CANDIDATE: "CANDIDATE",
});

export const ROLE_LIST = Object.values(ROLES);

export const PERMISSIONS = Object.freeze({
  // === PLATFORM SCOPE PERMISSIONS ===
  PLATFORM_VIEW: "platform.view",
  PLATFORM_CONFIG_MANAGE: "platform.config.manage",
  PLATFORM_FEATURES_MANAGE: "platform.features.manage",
  PLATFORM_HEALTH_VIEW: "platform.health.view",
  PLATFORM_SECURITY_VIEW: "platform.security.view",
  PLATFORM_AUDIT_LOGS_VIEW: "platform.audit_logs.view",
  PLATFORM_ACCESS_LOGS_VIEW: "platform.access_logs.view",
  PLATFORM_EVENTS_VIEW: "platform.events.view",
  PLATFORM_ROLES_MANAGE: "platform.roles.manage",
  PLATFORM_PERMISSIONS_MANAGE: "platform.permissions.manage",
  PLATFORM_ACCESS_MANAGE: "platform.access.manage",
  PLATFORM_MONITORING_VIEW: "platform.monitoring.view",
  PLATFORM_SERVICES_VIEW: "platform.services.view",
  PLATFORM_ACTIVITY_VIEW: "platform.activity.view",
  PLATFORM_PLANS_MANAGE: "platform.plans.manage",
  PLATFORM_SUBSCRIPTIONS_MANAGE: "platform.subscriptions.manage",
  PLATFORM_BILLING_MANAGE: "platform.billing.manage",
  PLATFORM_SETTINGS_MANAGE: "platform.settings.manage",

  ORGANIZATIONS_CREATE: "organizations.create",
  ORGANIZATIONS_VIEW: "organizations.view",
  ORGANIZATIONS_UPDATE: "organizations.update",
  ORGANIZATIONS_SUSPEND: "organizations.suspend",
  ORGANIZATIONS_DELETE: "organizations.delete",

  // === ORGANIZATION TENANT SCOPE PERMISSIONS ===
  ORG_PROFILE_VIEW: "organizations.profile.view",
  ORG_PROFILE_UPDATE: "organizations.profile.update",
  ORG_SETTINGS_MANAGE: "organizations.settings.manage",

  ORG_USERS_CREATE: "organization_users.create",
  ORG_USERS_VIEW: "organization_users.view",
  ORG_USERS_UPDATE: "organization_users.update",
  ORG_USERS_SUSPEND: "organization_users.suspend",
  ORG_USERS_REMOVE: "organization_users.remove",

  // Candidates & Rosters
  CANDIDATES_CREATE: "candidates.create",
  CANDIDATES_VIEW: "candidates.view",
  CANDIDATES_UPDATE: "candidates.update",
  CANDIDATES_DELETE: "candidates.delete",
  CANDIDATE_GROUPS_CREATE: "candidate_groups.create",
  CANDIDATE_GROUPS_VIEW: "candidate_groups.view",
  CANDIDATE_GROUPS_UPDATE: "candidate_groups.update",
  CANDIDATE_GROUPS_DELETE: "candidate_groups.delete",
  CANDIDATE_INVITATIONS_MANAGE: "candidate_invitations.manage",

  // Question Banks
  QUESTION_BANKS_CREATE: "question_banks.create",
  QUESTION_BANKS_VIEW: "question_banks.view",
  QUESTION_BANKS_UPDATE: "question_banks.update",
  QUESTION_BANKS_DELETE: "question_banks.delete",
  QUESTIONS_CREATE: "questions.create",
  QUESTIONS_VIEW: "questions.view",
  QUESTIONS_UPDATE: "questions.update",
  QUESTIONS_DELETE: "questions.delete",
  QUESTIONS_PUBLISH: "questions.publish",
  QUESTION_CATEGORIES_VIEW: "question_categories.view",
  QUESTION_CATEGORIES_MANAGE: "question_categories.manage",

  // Assessments
  ASSESSMENTS_CREATE: "assessments.create",
  ASSESSMENTS_VIEW: "assessments.view",
  ASSESSMENTS_UPDATE: "assessments.update",
  ASSESSMENTS_DELETE: "assessments.delete",
  ASSESSMENTS_PUBLISH: "assessments.publish",
  ASSESSMENTS_ARCHIVE: "assessments.archive",
  ASSESSMENT_SECTIONS_MANAGE: "assessment_sections.manage",
  ASSESSMENT_TEMPLATES_MANAGE: "assessment_templates.manage",
  ASSESSMENT_ASSIGNMENTS_CREATE: "assessment_assignments.create",
  ASSESSMENT_ASSIGNMENTS_VIEW: "assessment_assignments.view",
  ASSESSMENT_ASSIGNMENTS_UPDATE: "assessment_assignments.update",
  ASSESSMENT_ASSIGNMENTS_CANCEL: "assessment_assignments.cancel",

  // Live Interviews
  INTERVIEWS_CREATE: "interviews.create",
  INTERVIEWS_VIEW: "interviews.view",
  INTERVIEWS_UPDATE: "interviews.update",
  INTERVIEWS_DELETE: "interviews.delete",
  INTERVIEWS_JOIN: "interviews.join",
  INTERVIEWS_START: "interviews.start",
  INTERVIEWS_END: "interviews.end",
  INTERVIEWS_SCHEDULE: "interviews.schedule",
  INTERVIEWS_MANAGE_PARTICIPANTS: "interviews.manage_participants",
  INTERVIEWS_RECORD: "interviews.record",
  INTERVIEWS_VIEW_RECORDINGS: "interviews.view_recordings",
  INTERVIEWS_EVALUATE: "interviews.evaluate",

  // Proctoring & Integrity Telemetry
  PROCTORING_VIEW: "proctoring.view",
  PROCTORING_MONITOR: "proctoring.monitor",
  PROCTORING_REVIEW: "proctoring.review",
  PROCTORING_FLAG: "proctoring.flag",
  PROCTORING_RESOLVE: "proctoring.resolve",
  PROCTORING_SESSIONS_VIEW: "proctoring.sessions.view",
  PROCTORING_INCIDENTS_MANAGE: "proctoring.incidents.manage",
  PROCTORING_REPORTS_VIEW: "proctoring.reports.view",

  // Evaluations & Rubrics
  EVALUATIONS_CREATE: "evaluations.create",
  EVALUATIONS_VIEW: "evaluations.view",
  EVALUATIONS_UPDATE: "evaluations.update",
  EVALUATIONS_SUBMIT: "evaluations.submit",
  EVALUATIONS_APPROVE: "evaluations.approve",

  // Results & Reports
  RESULTS_CREATE: "results.create",
  RESULTS_VIEW: "results.view",
  RESULTS_GENERATE: "results.generate",
  RESULTS_PUBLISH: "results.publish",
  RESULTS_EXPORT: "results.export",
  REPORTS_VIEW: "reports.view",
  REPORTS_GENERATE: "reports.generate",
  REPORTS_EXPORT: "reports.export",
  ANALYTICS_VIEW: "analytics.view",

  // Tenant Operations & Governance
  TENANT_BILLING_VIEW: "tenant_billing.view",
  TENANT_BILLING_MANAGE: "tenant_billing.manage",
  TENANT_AUDIT_LOGS_VIEW: "tenant_audit_logs.view",
  TENANT_ACTIVITY_LOGS_VIEW: "tenant_activity_logs.view",

  // === CANDIDATE SCOPE PERMISSIONS ===
  CANDIDATE_DASHBOARD_VIEW: "candidate.dashboard.view",
  CANDIDATE_ASSESSMENTS_VIEW: "candidate.assessments.view",
  ATTEMPTS_CREATE: "attempts.create",
  ATTEMPTS_VIEW_OWN: "attempts.view_own",
  ATTEMPTS_UPDATE_OWN: "attempts.update_own",
  ATTEMPTS_SUBMIT_OWN: "attempts.submit_own",
  CANDIDATE_INTERVIEWS_VIEW: "candidate.interviews.view",
  EVALUATIONS_VIEW_OWN: "evaluations.view_own",
  RESULTS_VIEW_OWN: "results.view_own",
  CERTIFICATES_VIEW_OWN: "certificates.view_own",
  SYSTEM_CHECK_RUN: "system_check.run",
});

export const PERMISSION_LIST = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.PLATFORM_ADMIN]: [
    PERMISSIONS.PLATFORM_VIEW,
    PERMISSIONS.PLATFORM_CONFIG_MANAGE,
    PERMISSIONS.PLATFORM_FEATURES_MANAGE,
    PERMISSIONS.PLATFORM_HEALTH_VIEW,
    PERMISSIONS.PLATFORM_SECURITY_VIEW,
    PERMISSIONS.PLATFORM_AUDIT_LOGS_VIEW,
    PERMISSIONS.PLATFORM_ACCESS_LOGS_VIEW,
    PERMISSIONS.PLATFORM_EVENTS_VIEW,
    PERMISSIONS.PLATFORM_ROLES_MANAGE,
    PERMISSIONS.PLATFORM_PERMISSIONS_MANAGE,
    PERMISSIONS.PLATFORM_ACCESS_MANAGE,
    PERMISSIONS.PLATFORM_MONITORING_VIEW,
    PERMISSIONS.PLATFORM_SERVICES_VIEW,
    PERMISSIONS.PLATFORM_ACTIVITY_VIEW,
    PERMISSIONS.PLATFORM_PLANS_MANAGE,
    PERMISSIONS.PLATFORM_SUBSCRIPTIONS_MANAGE,
    PERMISSIONS.PLATFORM_BILLING_MANAGE,
    PERMISSIONS.PLATFORM_SETTINGS_MANAGE,
    PERMISSIONS.ORGANIZATIONS_CREATE,
    PERMISSIONS.ORGANIZATIONS_VIEW,
    PERMISSIONS.ORGANIZATIONS_UPDATE,
    PERMISSIONS.ORGANIZATIONS_SUSPEND,
    PERMISSIONS.ORGANIZATIONS_DELETE,
  ],

  [ROLES.ORGANIZATION_OWNER]: [
    PERMISSIONS.ORG_PROFILE_VIEW,
    PERMISSIONS.ORG_PROFILE_UPDATE,
    PERMISSIONS.ORG_SETTINGS_MANAGE,
    PERMISSIONS.ORG_USERS_CREATE,
    PERMISSIONS.ORG_USERS_VIEW,
    PERMISSIONS.ORG_USERS_UPDATE,
    PERMISSIONS.ORG_USERS_SUSPEND,
    PERMISSIONS.ORG_USERS_REMOVE,
    PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_UPDATE,
    PERMISSIONS.CANDIDATES_DELETE,
    PERMISSIONS.CANDIDATE_GROUPS_CREATE,
    PERMISSIONS.CANDIDATE_GROUPS_VIEW,
    PERMISSIONS.CANDIDATE_GROUPS_UPDATE,
    PERMISSIONS.CANDIDATE_GROUPS_DELETE,
    PERMISSIONS.CANDIDATE_INVITATIONS_MANAGE,
    PERMISSIONS.QUESTION_BANKS_CREATE,
    PERMISSIONS.QUESTION_BANKS_VIEW,
    PERMISSIONS.QUESTION_BANKS_UPDATE,
    PERMISSIONS.QUESTION_BANKS_DELETE,
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_UPDATE,
    PERMISSIONS.QUESTIONS_DELETE,
    PERMISSIONS.QUESTIONS_PUBLISH,
    PERMISSIONS.QUESTION_CATEGORIES_VIEW,
    PERMISSIONS.QUESTION_CATEGORIES_MANAGE,
    PERMISSIONS.ASSESSMENTS_CREATE,
    PERMISSIONS.ASSESSMENTS_VIEW,
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_DELETE,
    PERMISSIONS.ASSESSMENTS_PUBLISH,
    PERMISSIONS.ASSESSMENTS_ARCHIVE,
    PERMISSIONS.ASSESSMENT_SECTIONS_MANAGE,
    PERMISSIONS.ASSESSMENT_TEMPLATES_MANAGE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_VIEW,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_UPDATE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_CANCEL,
    PERMISSIONS.INTERVIEWS_CREATE,
    PERMISSIONS.INTERVIEWS_SCHEDULE,
    PERMISSIONS.INTERVIEWS_VIEW,
    PERMISSIONS.INTERVIEWS_UPDATE,
    PERMISSIONS.INTERVIEWS_DELETE,
    PERMISSIONS.INTERVIEWS_JOIN,
    PERMISSIONS.INTERVIEWS_START,
    PERMISSIONS.INTERVIEWS_END,
    PERMISSIONS.INTERVIEWS_MANAGE_PARTICIPANTS,
    PERMISSIONS.INTERVIEWS_RECORD,
    PERMISSIONS.INTERVIEWS_VIEW_RECORDINGS,
    PERMISSIONS.INTERVIEWS_EVALUATE,
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_REVIEW,
    PERMISSIONS.PROCTORING_FLAG,
    PERMISSIONS.PROCTORING_RESOLVE,
    PERMISSIONS.PROCTORING_SESSIONS_VIEW,
    PERMISSIONS.PROCTORING_INCIDENTS_MANAGE,
    PERMISSIONS.PROCTORING_REPORTS_VIEW,
    PERMISSIONS.EVALUATIONS_CREATE,
    PERMISSIONS.EVALUATIONS_VIEW,
    PERMISSIONS.EVALUATIONS_UPDATE,
    PERMISSIONS.EVALUATIONS_SUBMIT,
    PERMISSIONS.EVALUATIONS_APPROVE,
    PERMISSIONS.RESULTS_CREATE,
    PERMISSIONS.RESULTS_VIEW,
    PERMISSIONS.RESULTS_GENERATE,
    PERMISSIONS.RESULTS_PUBLISH,
    PERMISSIONS.RESULTS_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.TENANT_BILLING_VIEW,
    PERMISSIONS.TENANT_BILLING_MANAGE,
    PERMISSIONS.TENANT_AUDIT_LOGS_VIEW,
    PERMISSIONS.TENANT_ACTIVITY_LOGS_VIEW,
  ].filter(Boolean),

  [ROLES.ORGANIZATION_ADMIN]: [
    PERMISSIONS.ORG_PROFILE_VIEW,
    PERMISSIONS.ORG_PROFILE_UPDATE,
    PERMISSIONS.ORG_USERS_CREATE,
    PERMISSIONS.ORG_USERS_VIEW,
    PERMISSIONS.ORG_USERS_UPDATE,
    PERMISSIONS.ORG_USERS_SUSPEND,
    PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_UPDATE,
    PERMISSIONS.CANDIDATES_DELETE,
    PERMISSIONS.CANDIDATE_GROUPS_CREATE,
    PERMISSIONS.CANDIDATE_GROUPS_VIEW,
    PERMISSIONS.CANDIDATE_GROUPS_UPDATE,
    PERMISSIONS.CANDIDATE_GROUPS_DELETE,
    PERMISSIONS.CANDIDATE_INVITATIONS_MANAGE,
    PERMISSIONS.QUESTION_BANKS_CREATE,
    PERMISSIONS.QUESTION_BANKS_VIEW,
    PERMISSIONS.QUESTION_BANKS_UPDATE,
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_UPDATE,
    PERMISSIONS.QUESTIONS_PUBLISH,
    PERMISSIONS.QUESTION_CATEGORIES_VIEW,
    PERMISSIONS.QUESTION_CATEGORIES_MANAGE,
    PERMISSIONS.ASSESSMENTS_CREATE,
    PERMISSIONS.ASSESSMENTS_VIEW,
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENTS_PUBLISH,
    PERMISSIONS.ASSESSMENTS_ARCHIVE,
    PERMISSIONS.ASSESSMENT_SECTIONS_MANAGE,
    PERMISSIONS.ASSESSMENT_TEMPLATES_MANAGE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_VIEW,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_UPDATE,
    PERMISSIONS.INTERVIEWS_CREATE,
    PERMISSIONS.INTERVIEWS_SCHEDULE,
    PERMISSIONS.INTERVIEWS_VIEW,
    PERMISSIONS.INTERVIEWS_UPDATE,
    PERMISSIONS.INTERVIEWS_JOIN,
    PERMISSIONS.INTERVIEWS_START,
    PERMISSIONS.INTERVIEWS_END,
    PERMISSIONS.INTERVIEWS_MANAGE_PARTICIPANTS,
    PERMISSIONS.INTERVIEWS_RECORD,
    PERMISSIONS.INTERVIEWS_VIEW_RECORDINGS,
    PERMISSIONS.INTERVIEWS_EVALUATE,
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_REVIEW,
    PERMISSIONS.PROCTORING_FLAG,
    PERMISSIONS.PROCTORING_RESOLVE,
    PERMISSIONS.PROCTORING_SESSIONS_VIEW,
    PERMISSIONS.PROCTORING_INCIDENTS_MANAGE,
    PERMISSIONS.PROCTORING_REPORTS_VIEW,
    PERMISSIONS.EVALUATIONS_CREATE,
    PERMISSIONS.EVALUATIONS_VIEW,
    PERMISSIONS.EVALUATIONS_UPDATE,
    PERMISSIONS.EVALUATIONS_SUBMIT,
    PERMISSIONS.EVALUATIONS_APPROVE,
    PERMISSIONS.RESULTS_CREATE,
    PERMISSIONS.RESULTS_VIEW,
    PERMISSIONS.RESULTS_GENERATE,
    PERMISSIONS.RESULTS_PUBLISH,
    PERMISSIONS.RESULTS_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.TENANT_ACTIVITY_LOGS_VIEW,
  ].filter(Boolean),

  [ROLES.EXAMINER]: [
    PERMISSIONS.ORG_PROFILE_VIEW,
    PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_VIEW,
    PERMISSIONS.CANDIDATES_UPDATE,
    PERMISSIONS.CANDIDATE_GROUPS_CREATE,
    PERMISSIONS.CANDIDATE_GROUPS_VIEW,
    PERMISSIONS.QUESTION_BANKS_CREATE,
    PERMISSIONS.QUESTION_BANKS_VIEW,
    PERMISSIONS.QUESTION_BANKS_UPDATE,
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_UPDATE,
    PERMISSIONS.ASSESSMENTS_CREATE,
    PERMISSIONS.ASSESSMENTS_VIEW,
    PERMISSIONS.ASSESSMENTS_UPDATE,
    PERMISSIONS.ASSESSMENT_ASSIGNMENTS_VIEW,
    PERMISSIONS.INTERVIEWS_CREATE,
    PERMISSIONS.INTERVIEWS_SCHEDULE,
    PERMISSIONS.INTERVIEWS_VIEW,
    PERMISSIONS.INTERVIEWS_JOIN,
    PERMISSIONS.INTERVIEWS_START,
    PERMISSIONS.INTERVIEWS_END,
    PERMISSIONS.INTERVIEWS_EVALUATE,
    PERMISSIONS.INTERVIEWS_VIEW_RECORDINGS,
    PERMISSIONS.EVALUATIONS_CREATE,
    PERMISSIONS.EVALUATIONS_VIEW,
    PERMISSIONS.EVALUATIONS_UPDATE,
    PERMISSIONS.EVALUATIONS_SUBMIT,
    PERMISSIONS.RESULTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ].filter(Boolean),

  [ROLES.PROCTOR]: [
    PERMISSIONS.ORG_PROFILE_VIEW,
    PERMISSIONS.PROCTORING_VIEW,
    PERMISSIONS.PROCTORING_MONITOR,
    PERMISSIONS.PROCTORING_REVIEW,
    PERMISSIONS.PROCTORING_FLAG,
    PERMISSIONS.PROCTORING_RESOLVE,
    PERMISSIONS.PROCTORING_SESSIONS_VIEW,
    PERMISSIONS.PROCTORING_INCIDENTS_MANAGE,
    PERMISSIONS.PROCTORING_REPORTS_VIEW,
    PERMISSIONS.INTERVIEWS_VIEW,
    PERMISSIONS.INTERVIEWS_JOIN,
    PERMISSIONS.INTERVIEWS_RECORD,
    PERMISSIONS.INTERVIEWS_VIEW_RECORDINGS,
  ].filter(Boolean),

  [ROLES.CANDIDATE]: [
    PERMISSIONS.CANDIDATE_DASHBOARD_VIEW,
    PERMISSIONS.CANDIDATE_ASSESSMENTS_VIEW,
    PERMISSIONS.ATTEMPTS_CREATE,
    PERMISSIONS.ATTEMPTS_VIEW_OWN,
    PERMISSIONS.ATTEMPTS_UPDATE_OWN,
    PERMISSIONS.ATTEMPTS_SUBMIT_OWN,
    PERMISSIONS.CANDIDATE_INTERVIEWS_VIEW,
    PERMISSIONS.INTERVIEWS_JOIN,
    PERMISSIONS.EVALUATIONS_VIEW_OWN,
    PERMISSIONS.RESULTS_VIEW_OWN,
    PERMISSIONS.CERTIFICATES_VIEW_OWN,
    PERMISSIONS.SYSTEM_CHECK_RUN,
  ].filter(Boolean),
});

/**
 * Grouped Canonical Sidebar Configuration
 */
/**
 * Fully Optimized, De-duplicated Sidebar Configuration
 */
export const SIDEBAR_CONFIG = Object.freeze({
  [ROLES.PLATFORM_ADMIN]: [
    { label: "Dashboard", path: "/platform/dashboard", id: "platform-dashboard", icon: "LayoutDashboard", permission: PERMISSIONS.PLATFORM_VIEW },
    {
      group: "Tenants & Workspaces",
      items: [
        { label: "Tenant Organizations", path: "/platform/organizations", id: "platform-organizations", icon: "Building2", permission: PERMISSIONS.ORGANIZATIONS_VIEW },
        { label: "Provision Tenant", path: "/platform/onboarding", id: "platform-onboarding", icon: "PlusCircle", permission: PERMISSIONS.ORGANIZATIONS_CREATE },
      ],
    },
    {
      group: "Security & Governance",
      items: [
        { label: "Security Center", path: "/platform/security", id: "platform-security", icon: "ShieldCheck", permission: PERMISSIONS.PLATFORM_SECURITY_VIEW },
        { label: "Audit Logs", path: "/platform/audit-logs", id: "platform-audit-logs", icon: "FileText", permission: PERMISSIONS.PLATFORM_AUDIT_LOGS_VIEW },
        { label: "Platform Access", path: "/platform/access", id: "platform-access", icon: "Key", permission: PERMISSIONS.PLATFORM_ACCESS_MANAGE },
      ],
    },
    {
      group: "Infrastructure & Health",
      items: [
        { label: "System Monitoring", path: "/platform/monitoring", id: "platform-monitoring", icon: "BarChart3", permission: PERMISSIONS.PLATFORM_MONITORING_VIEW },
        { label: "Service Health", path: "/platform/services", id: "platform-services", icon: "Activity", permission: PERMISSIONS.PLATFORM_SERVICES_VIEW },
      ],
    },
    {
      group: "Commercial & Plans",
      items: [
        { label: "Subscription Plans", path: "/platform/plans", id: "platform-plans", icon: "ClipboardList", permission: PERMISSIONS.PLATFORM_PLANS_MANAGE },
        { label: "Platform Billing", path: "/platform/billing", id: "platform-billing", icon: "CreditCard", permission: PERMISSIONS.PLATFORM_BILLING_MANAGE },
      ],
    },
    { label: "Platform Settings", path: "/platform/settings", id: "platform-settings", icon: "Settings", permission: PERMISSIONS.PLATFORM_SETTINGS_MANAGE },
  ],

  [ROLES.ORGANIZATION_OWNER]: [
    { label: "Dashboard", path: "/organization/dashboard", id: "org-dashboard", icon: "LayoutDashboard", permission: PERMISSIONS.ORG_PROFILE_VIEW },
    {
      group: "Assessments",
      items: [
        { label: "Assessments Library", path: "/organization/assessments", id: "org-assessments", icon: "FileText", permission: PERMISSIONS.ASSESSMENTS_VIEW },
        { label: "Create Assessment", path: "/organization/builder", id: "org-assessment-builder", icon: "PlusCircle", permission: PERMISSIONS.ASSESSMENTS_CREATE },
        { label: "Question Banks", path: "/organization/question-bank", id: "org-question-bank", icon: "Library", permission: PERMISSIONS.QUESTION_BANKS_VIEW },
      ],
    },
    {
      group: "Interviews",
      items: [
        { label: "Live Interviews", path: "/organization/interviews", id: "org-interviews", icon: "Video", permission: PERMISSIONS.INTERVIEWS_VIEW },
        { label: "Grading & Rubrics", path: "/organization/evaluations", id: "org-evaluations", icon: "ClipboardList", permission: PERMISSIONS.EVALUATIONS_VIEW },
      ],
    },
    { label: "Candidate Roster", path: "/organization/participants", id: "org-participants", icon: "Users", permission: PERMISSIONS.CANDIDATES_VIEW },
    { label: "Team & Staff", path: "/organization/users", id: "org-users", icon: "Users", permission: PERMISSIONS.ORG_USERS_VIEW },
    {
      group: "Proctoring & Integrity",
      items: [
        { label: "Live Telemetry", path: "/organization/integrity", id: "org-integrity", icon: "ShieldCheck", permission: PERMISSIONS.PROCTORING_VIEW },
        { label: "Incident Evidence", path: "/organization/integrity/evidence", id: "org-integrity-evidence", icon: "ShieldAlert", permission: PERMISSIONS.PROCTORING_FLAG },
        { label: "Session Archive", path: "/organization/sessions", id: "org-sessions", icon: "Activity", permission: PERMISSIONS.PROCTORING_SESSIONS_VIEW },
      ],
    },
    { label: "Results & Reports", path: "/organization/reports", id: "org-reports", icon: "BarChart3", permission: PERMISSIONS.REPORTS_VIEW },
    { label: "Billing", path: "/organization/billing", id: "org-billing", icon: "CreditCard", permission: PERMISSIONS.TENANT_BILLING_VIEW },
    { label: "Workspace Settings", path: "/organization/settings", id: "org-settings", icon: "Settings", permission: PERMISSIONS.ORG_PROFILE_UPDATE },
  ],

  [ROLES.ORGANIZATION_ADMIN]: [
    { label: "Dashboard", path: "/organization/dashboard", id: "org-dashboard", icon: "LayoutDashboard", permission: PERMISSIONS.ORG_PROFILE_VIEW },
    {
      group: "Assessments",
      items: [
        { label: "Assessments Library", path: "/organization/assessments", id: "org-assessments", icon: "FileText", permission: PERMISSIONS.ASSESSMENTS_VIEW },
        { label: "Create Assessment", path: "/organization/builder", id: "org-assessment-builder", icon: "PlusCircle", permission: PERMISSIONS.ASSESSMENTS_CREATE },
        { label: "Question Banks", path: "/organization/question-bank", id: "org-question-bank", icon: "Library", permission: PERMISSIONS.QUESTION_BANKS_VIEW },
      ],
    },
    {
      group: "Interviews",
      items: [
        { label: "Live Interviews", path: "/organization/interviews", id: "org-interviews", icon: "Video", permission: PERMISSIONS.INTERVIEWS_VIEW },
        { label: "Grading & Rubrics", path: "/organization/evaluations", id: "org-evaluations", icon: "ClipboardList", permission: PERMISSIONS.EVALUATIONS_VIEW },
      ],
    },
    { label: "Candidate Roster", path: "/organization/participants", id: "org-participants", icon: "Users", permission: PERMISSIONS.CANDIDATES_VIEW },
    { label: "Team & Staff", path: "/organization/users", id: "org-users", icon: "Users", permission: PERMISSIONS.ORG_USERS_VIEW },
    {
      group: "Proctoring & Integrity",
      items: [
        { label: "Live Telemetry", path: "/organization/integrity", id: "org-integrity", icon: "ShieldCheck", permission: PERMISSIONS.PROCTORING_VIEW },
        { label: "Incident Evidence", path: "/organization/integrity/evidence", id: "org-integrity-evidence", icon: "ShieldAlert", permission: PERMISSIONS.PROCTORING_FLAG },
        { label: "Session Archive", path: "/organization/sessions", id: "org-sessions", icon: "Activity", permission: PERMISSIONS.PROCTORING_SESSIONS_VIEW },
      ],
    },
    { label: "Results & Reports", path: "/organization/reports", id: "org-reports", icon: "BarChart3", permission: PERMISSIONS.REPORTS_VIEW },
    { label: "Workspace Settings", path: "/organization/settings", id: "org-settings", icon: "Settings", permission: PERMISSIONS.ORG_PROFILE_UPDATE },
  ],

  [ROLES.EXAMINER]: [
    { label: "Dashboard", path: "/organization/dashboard", id: "org-dashboard", icon: "LayoutDashboard", permission: PERMISSIONS.ORG_PROFILE_VIEW },
    {
      group: "Assessments",
      items: [
        { label: "My Assessments", path: "/organization/assessments", id: "org-assessments", icon: "FileText", permission: PERMISSIONS.ASSESSMENTS_VIEW },
        { label: "Create Assessment", path: "/organization/builder", id: "org-assessment-builder", icon: "PlusCircle", permission: PERMISSIONS.ASSESSMENTS_CREATE },
        { label: "Question Banks", path: "/organization/question-bank", id: "org-question-bank", icon: "Library", permission: PERMISSIONS.QUESTION_BANKS_VIEW },
      ],
    },
    {
      group: "Interviews",
      items: [
        { label: "My Interviews", path: "/organization/interviews", id: "org-interviews", icon: "Video", permission: PERMISSIONS.INTERVIEWS_VIEW },
        { label: "Evaluations & Rubrics", path: "/organization/evaluations", id: "org-evaluations", icon: "ClipboardList", permission: PERMISSIONS.EVALUATIONS_VIEW },
      ],
    },
    { label: "Candidate Roster", path: "/organization/participants", id: "org-participants", icon: "Users", permission: PERMISSIONS.CANDIDATES_VIEW },
    { label: "Results & Performance", path: "/organization/reports", id: "org-reports", icon: "BarChart3", permission: PERMISSIONS.RESULTS_VIEW },
  ],

  [ROLES.PROCTOR]: [
    { label: "Dashboard", path: "/organization/dashboard", id: "org-dashboard", icon: "LayoutDashboard", permission: PERMISSIONS.ORG_PROFILE_VIEW },
    {
      group: "Proctoring & Integrity",
      items: [
        { label: "Live Telemetry", path: "/organization/integrity", id: "org-integrity", icon: "ShieldCheck", permission: PERMISSIONS.PROCTORING_VIEW },
        { label: "Incident Evidence", path: "/organization/integrity/evidence", id: "org-integrity-evidence", icon: "ShieldAlert", permission: PERMISSIONS.PROCTORING_FLAG },
        { label: "Session Archive", path: "/organization/sessions", id: "org-sessions", icon: "Activity", permission: PERMISSIONS.PROCTORING_SESSIONS_VIEW },
      ],
    },
    { label: "Proctoring Reports", path: "/organization/reports", id: "org-reports", icon: "BarChart3", permission: PERMISSIONS.PROCTORING_REPORTS_VIEW },
  ],

  [ROLES.CANDIDATE]: [
    { label: "Dashboard", path: "/candidate/dashboard", id: "candidate-dashboard", icon: "LayoutDashboard", permission: PERMISSIONS.CANDIDATE_DASHBOARD_VIEW },
    { label: "Active Assessment", path: "/candidate/assessment", id: "participant-assessment", icon: "FileText", permission: PERMISSIONS.ATTEMPTS_CREATE },
    { label: "Live Interview", path: "/candidate/interview", id: "participant-interview", icon: "Video", permission: PERMISSIONS.INTERVIEWS_JOIN },
    { label: "Results & Feedback", path: "/candidate/evaluation", id: "participant-evaluation", icon: "ClipboardList", permission: PERMISSIONS.RESULTS_VIEW_OWN },
    { label: "System Diagnostic", path: "/candidate/system-check", id: "participant-system-check", icon: "ShieldCheck", permission: PERMISSIONS.SYSTEM_CHECK_RUN },
  ],
});

/**
 * Checks whether a given role or user object has a specific permission
 */
export const hasPermission = (userOrRole, permission) => {
  if (!userOrRole || !permission) return false;

  const roleName =
    typeof userOrRole === "string"
      ? userOrRole
      : userOrRole.role ||
        userOrRole.roleName ||
        userOrRole.platformRole ||
        userOrRole.roleId?.name ||
        userOrRole.memberships?.[0]?.roleId?.name ||
        "";

  const normalized = roleName.toUpperCase();

  const rolePerms = ROLE_PERMISSIONS[normalized] || [];
  return rolePerms.includes(permission);
};

/**
 * Checks whether a given role or user object has at least one permission from the list
 */
export const hasAnyPermission = (userOrRole, permissions = []) => {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  return permissions.some((perm) => hasPermission(userOrRole, perm));
};

/**
 * Returns the configured sidebar navigation array for the specified role
 */
export const getSidebarForRole = (role) => {
  if (!role) return SIDEBAR_CONFIG[ROLES.ORGANIZATION_ADMIN] || [];
  const normalized = typeof role === "string" ? role.toUpperCase() : (role.name || "").toUpperCase();
  return SIDEBAR_CONFIG[normalized] || SIDEBAR_CONFIG[ROLES.ORGANIZATION_ADMIN] || [];
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  SIDEBAR_CONFIG,
  hasPermission,
  hasAnyPermission,
  getSidebarForRole,
};
