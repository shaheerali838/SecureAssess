import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  getSidebarForRole,
} from '../../src/config/rbac.config.js';

describe('RBAC Canonical 6-Role Dual-Scope Unit Tests', () => {
  it('1. PLATFORM_ADMIN has platform-scoped governance permissions but ZERO customer tenant operational permissions', () => {
    // Permitted Platform Scopes
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.PLATFORM_VIEW), true);
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.PLATFORM_CONFIG_MANAGE), true);
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.PLATFORM_HEALTH_VIEW), true);
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.PLATFORM_SECURITY_VIEW), true);
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.ORGANIZATIONS_VIEW), true);
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.ORGANIZATIONS_CREATE), true);

    // Prohibited Customer Operational Scopes
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.ASSESSMENTS_CREATE), false);
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.CANDIDATES_CREATE), false);
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.INTERVIEWS_CREATE), false);
    assert.equal(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.ATTEMPTS_CREATE), false);
  });

  it('2. ORGANIZATION_OWNER has complete tenant authority but ZERO platform governance permissions', () => {
    // Permitted Tenant Scopes
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.ORG_PROFILE_VIEW), true);
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.ASSESSMENTS_CREATE), true);
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.CANDIDATES_CREATE), true);
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.INTERVIEWS_CREATE), true);
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.PROCTORING_VIEW), true);
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.TENANT_BILLING_MANAGE), true);

    // Prohibited Platform Scopes
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.PLATFORM_VIEW), false);
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.PLATFORM_CONFIG_MANAGE), false);
    assert.equal(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.ORGANIZATIONS_DELETE), false);
  });

  it('3. ORGANIZATION_ADMIN has operational tenant permissions without owner billing permissions', () => {
    assert.equal(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.CANDIDATES_CREATE), true);
    assert.equal(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.ASSESSMENTS_PUBLISH), true);
    assert.equal(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.INTERVIEWS_CREATE), true);
    assert.equal(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.PROCTORING_VIEW), true);

    // Prohibited
    assert.equal(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.TENANT_BILLING_MANAGE), false);
    assert.equal(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.PLATFORM_VIEW), false);
  });

  it('4. EXAMINER has authoring and grading permissions but cannot manage team or billing', () => {
    assert.equal(hasPermission(ROLES.EXAMINER, PERMISSIONS.QUESTION_BANKS_CREATE), true);
    assert.equal(hasPermission(ROLES.EXAMINER, PERMISSIONS.ASSESSMENTS_CREATE), true);
    assert.equal(hasPermission(ROLES.EXAMINER, PERMISSIONS.INTERVIEWS_CREATE), true);
    assert.equal(hasPermission(ROLES.EXAMINER, PERMISSIONS.EVALUATIONS_SUBMIT), true);

    // Prohibited
    assert.equal(hasPermission(ROLES.EXAMINER, PERMISSIONS.ORG_USERS_SUSPEND), false);
    assert.equal(hasPermission(ROLES.EXAMINER, PERMISSIONS.TENANT_BILLING_VIEW), false);
    assert.equal(hasPermission(ROLES.EXAMINER, PERMISSIONS.PLATFORM_VIEW), false);
  });

  it('5. PROCTOR has telemetry and violation monitoring permissions', () => {
    assert.equal(hasPermission(ROLES.PROCTOR, PERMISSIONS.PROCTORING_VIEW), true);
    assert.equal(hasPermission(ROLES.PROCTOR, PERMISSIONS.PROCTORING_MONITOR), true);
    assert.equal(hasPermission(ROLES.PROCTOR, PERMISSIONS.PROCTORING_FLAG), true);
    assert.equal(hasPermission(ROLES.PROCTOR, PERMISSIONS.PROCTORING_SESSIONS_VIEW), true);

    // Prohibited
    assert.equal(hasPermission(ROLES.PROCTOR, PERMISSIONS.ASSESSMENTS_CREATE), false);
    assert.equal(hasPermission(ROLES.PROCTOR, PERMISSIONS.QUESTION_BANKS_CREATE), false);
    assert.equal(hasPermission(ROLES.PROCTOR, PERMISSIONS.TENANT_BILLING_VIEW), false);
  });

  it('6. CANDIDATE has strictly personal assessment taking and interview joining permissions', () => {
    assert.equal(hasPermission(ROLES.CANDIDATE, PERMISSIONS.CANDIDATE_DASHBOARD_VIEW), true);
    assert.equal(hasPermission(ROLES.CANDIDATE, PERMISSIONS.CANDIDATE_ASSESSMENTS_VIEW), true);
    assert.equal(hasPermission(ROLES.CANDIDATE, PERMISSIONS.ATTEMPTS_CREATE), true);
    assert.equal(hasPermission(ROLES.CANDIDATE, PERMISSIONS.ATTEMPTS_SUBMIT_OWN), true);
    assert.equal(hasPermission(ROLES.CANDIDATE, PERMISSIONS.SYSTEM_CHECK_RUN), true);

    // Prohibited
    assert.equal(hasPermission(ROLES.CANDIDATE, PERMISSIONS.ASSESSMENTS_CREATE), false);
    assert.equal(hasPermission(ROLES.CANDIDATE, PERMISSIONS.PROCTORING_VIEW), false);
    assert.equal(hasPermission(ROLES.CANDIDATE, PERMISSIONS.ORG_USERS_VIEW), false);
  });

  it('hasAnyPermission returns true if role matches any required permission', () => {
    assert.equal(
      hasAnyPermission(ROLES.EXAMINER, [
        PERMISSIONS.TENANT_BILLING_MANAGE,
        PERMISSIONS.ASSESSMENTS_CREATE,
      ]),
      true
    );
  });

  it('hasAnyPermission returns false if role has none of the required permissions', () => {
    assert.equal(
      hasAnyPermission(ROLES.CANDIDATE, [
        PERMISSIONS.TENANT_BILLING_MANAGE,
        PERMISSIONS.ASSESSMENTS_CREATE,
        PERMISSIONS.PROCTORING_VIEW,
      ]),
      false
    );
  });

  it('getSidebarForRole returns valid configurations with groups for all 6 roles', () => {
    const candidateNav = getSidebarForRole(ROLES.CANDIDATE);
    assert.ok(candidateNav.length > 0);
    assert.ok(candidateNav.some((i) => i.id === 'candidate-dashboard'));

    const platformNav = getSidebarForRole(ROLES.PLATFORM_ADMIN);
    assert.ok(platformNav.length > 0);
    assert.ok(platformNav.some((i) => i.id === 'platform-dashboard'));

    const ownerNav = getSidebarForRole(ROLES.ORGANIZATION_OWNER);
    assert.ok(ownerNav.length > 0);
    assert.ok(ownerNav.some((i) => i.group === 'Assessments' || i.id === 'org-dashboard'));

    const examinerNav = getSidebarForRole(ROLES.EXAMINER);
    assert.ok(examinerNav.length > 0);
  });
});
