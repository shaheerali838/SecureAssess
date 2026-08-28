export const ROLE_SCOPES = Object.freeze({
  PLATFORM: 'PLATFORM',
  ORGANIZATION: 'ORGANIZATION',
});

export const PLATFORM_ROLES = Object.freeze({
  PLATFORM_OWNER: 'PLATFORM_OWNER',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
});

export const PLATFORM_ROLE_LIST = Object.values(PLATFORM_ROLES);

export const ORGANIZATION_ROLES = Object.freeze({
  ORGANIZATION_OWNER: 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN: 'ORGANIZATION_ADMIN',
  EXAMINER: 'EXAMINER',
  PROCTOR: 'PROCTOR',
  CANDIDATE: 'CANDIDATE',
});

export const ORGANIZATION_ROLE_LIST = Object.values(ORGANIZATION_ROLES);

export const ROLES = Object.freeze({
  ...PLATFORM_ROLES,
  ...ORGANIZATION_ROLES,
});

export const ROLE_LIST = Object.values(ROLES);

export const ROLE_LABELS = Object.freeze({
  [PLATFORM_ROLES.PLATFORM_OWNER]: 'Platform Owner',
  [PLATFORM_ROLES.PLATFORM_ADMIN]: 'Platform Administrator',
  [ORGANIZATION_ROLES.ORGANIZATION_OWNER]: 'Organization Owner',
  [ORGANIZATION_ROLES.ORGANIZATION_ADMIN]: 'Organization Administrator',
  [ORGANIZATION_ROLES.EXAMINER]: 'Examiner / Faculty',
  [ORGANIZATION_ROLES.PROCTOR]: 'Proctor / Invigilator',
  [ORGANIZATION_ROLES.CANDIDATE]: 'Candidate / Student',
});
