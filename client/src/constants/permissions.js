export const PLATFORM_PERMISSIONS = Object.freeze({
  MANAGE_PLATFORM_SETTINGS: 'platform.settings.manage',
  VIEW_PLATFORM_ANALYTICS: 'platform.analytics.view',
  MANAGE_ORGANIZATIONS: 'platform.organizations.manage',
  VIEW_ORGANIZATIONS: 'platform.organizations.view',
  MANAGE_PLATFORM_USERS: 'platform.users.manage',
  VIEW_PLATFORM_USERS: 'platform.users.view',
  MANAGE_GLOBAL_ROLES: 'platform.roles.manage',
  VIEW_GLOBAL_AUDIT_LOGS: 'platform.audit.view',
  MANAGE_SUBSCRIPTIONS: 'platform.subscriptions.manage',
});

export const ORGANIZATION_PERMISSIONS = Object.freeze({
  // Organization Settings
  MANAGE_ORGANIZATION_SETTINGS: 'org.settings.manage',
  VIEW_ORGANIZATION_SETTINGS: 'org.settings.view',
  
  // Membership & Staff
  MANAGE_MEMBERS: 'org.members.manage',
  VIEW_MEMBERS: 'org.members.view',
  INVITE_MEMBERS: 'org.members.invite',
  
  // Candidates & Batches
  MANAGE_CANDIDATES: 'org.candidates.manage',
  VIEW_CANDIDATES: 'org.candidates.view',
  MANAGE_BATCHES: 'org.batches.manage',
  VIEW_BATCHES: 'org.batches.view',
  
  // Question Banks & Questions
  MANAGE_QUESTION_BANKS: 'org.questionBanks.manage',
  VIEW_QUESTION_BANKS: 'org.questionBanks.view',
  MANAGE_QUESTIONS: 'org.questions.manage',
  VIEW_QUESTIONS: 'org.questions.view',
  
  // Assessments & Assignments
  MANAGE_ASSESSMENTS: 'org.assessments.manage',
  VIEW_ASSESSMENTS: 'org.assessments.view',
  PUBLISH_ASSESSMENTS: 'org.assessments.publish',
  ASSIGN_ASSESSMENTS: 'org.assignments.manage',
  VIEW_ASSIGNMENTS: 'org.assignments.view',
  
  // Examination & Proctoring
  MONITOR_ATTEMPTS: 'org.attempts.monitor',
  VIEW_ATTEMPTS: 'org.attempts.view',
  MANAGE_PROCTORING: 'org.proctoring.manage',
  VIEW_PROCTORING: 'org.proctoring.view',
  
  // Grading & Results
  GRADE_SUBMISSIONS: 'org.grading.manage',
  VIEW_RESULTS: 'org.results.view',
  PUBLISH_RESULTS: 'org.results.publish',
  GENERATE_REPORTS: 'org.reports.generate',
  
  // Certificates
  MANAGE_CERTIFICATES: 'org.certificates.manage',
  VIEW_CERTIFICATES: 'org.certificates.view',
  
  // Candidate Specific
  VIEW_OWN_ASSESSMENTS: 'candidate.assessments.view',
  START_ATTEMPT: 'candidate.attempt.start',
  SUBMIT_ATTEMPT: 'candidate.attempt.submit',
  VIEW_OWN_RESULTS: 'candidate.results.view',
  VIEW_OWN_CERTIFICATES: 'candidate.certificates.view',
});

export const PERMISSIONS = Object.freeze({
  ...PLATFORM_PERMISSIONS,
  ...ORGANIZATION_PERMISSIONS,
});
