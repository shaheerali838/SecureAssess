import { describe, it, expect } from 'vitest';
import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  getSidebarForRole,
} from '../../src/config/rbac.config.js';

describe('RBAC Canonical Config Unit Tests', () => {
  describe('hasPermission tests for all 7 roles', () => {
    it('Platform Owner has root access to any permission', () => {
      expect(hasPermission(ROLES.PLATFORM_OWNER, PERMISSIONS.PLATFORM_VIEW)).toBe(true);
      expect(hasPermission(ROLES.PLATFORM_OWNER, PERMISSIONS.ASSESSMENTS_CREATE)).toBe(true);
      expect(hasPermission(ROLES.PLATFORM_OWNER, PERMISSIONS.PROCTORING_RESOLVE)).toBe(true);
    });

    it('Platform Admin has platform-scoped permissions but not org-specific operational ones', () => {
      expect(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.PLATFORM_VIEW)).toBe(true);
      expect(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.ORGANIZATIONS_VIEW)).toBe(true);
      expect(hasPermission(ROLES.PLATFORM_ADMIN, PERMISSIONS.ASSESSMENTS_CREATE)).toBe(false);
    });

    it('Organization Owner has full tenant authority', () => {
      expect(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.ORG_PROFILE_VIEW)).toBe(true);
      expect(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.ASSESSMENTS_CREATE)).toBe(true);
      expect(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.BILLING_MANAGE)).toBe(true);
      expect(hasPermission(ROLES.ORGANIZATION_OWNER, PERMISSIONS.PLATFORM_SETTINGS_MANAGE)).toBe(false);
    });

    it('Organization Admin has organizational management permissions', () => {
      expect(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.CANDIDATES_CREATE)).toBe(true);
      expect(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.ASSESSMENTS_PUBLISH)).toBe(true);
      expect(hasPermission(ROLES.ORGANIZATION_ADMIN, PERMISSIONS.PLATFORM_VIEW)).toBe(false);
    });

    it('Examiner has question bank authoring and grading permissions', () => {
      expect(hasPermission(ROLES.EXAMINER, PERMISSIONS.QUESTION_BANKS_CREATE)).toBe(true);
      expect(hasPermission(ROLES.EXAMINER, PERMISSIONS.ASSESSMENTS_CREATE)).toBe(true);
      expect(hasPermission(ROLES.EXAMINER, PERMISSIONS.EVALUATIONS_SUBMIT)).toBe(true);
      expect(hasPermission(ROLES.EXAMINER, PERMISSIONS.BILLING_MANAGE)).toBe(false);
      expect(hasPermission(ROLES.EXAMINER, PERMISSIONS.ORG_USERS_SUSPEND)).toBe(false);
    });

    it('Proctor has live monitoring and telemetry permissions', () => {
      expect(hasPermission(ROLES.PROCTOR, PERMISSIONS.PROCTORING_VIEW)).toBe(true);
      expect(hasPermission(ROLES.PROCTOR, PERMISSIONS.PROCTORING_MONITOR)).toBe(true);
      expect(hasPermission(ROLES.PROCTOR, PERMISSIONS.PROCTORING_FLAG)).toBe(true);
      expect(hasPermission(ROLES.PROCTOR, PERMISSIONS.ASSESSMENTS_CREATE)).toBe(false);
      expect(hasPermission(ROLES.PROCTOR, PERMISSIONS.BILLING_VIEW)).toBe(false);
    });

    it('Candidate has test-taking and view_own permissions', () => {
      expect(hasPermission(ROLES.CANDIDATE, PERMISSIONS.ATTEMPTS_CREATE)).toBe(true);
      expect(hasPermission(ROLES.CANDIDATE, PERMISSIONS.ATTEMPTS_VIEW_OWN)).toBe(true);
      expect(hasPermission(ROLES.CANDIDATE, PERMISSIONS.ATTEMPTS_SUBMIT_OWN)).toBe(true);
      expect(hasPermission(ROLES.CANDIDATE, PERMISSIONS.EVALUATIONS_VIEW_OWN)).toBe(true);
      expect(hasPermission(ROLES.CANDIDATE, PERMISSIONS.ASSESSMENTS_CREATE)).toBe(false);
      expect(hasPermission(ROLES.CANDIDATE, PERMISSIONS.PROCTORING_VIEW)).toBe(false);
    });
  });

  describe('hasAnyPermission tests', () => {
    it('returns true if role matches any required permission', () => {
      expect(
        hasAnyPermission(ROLES.EXAMINER, [
          PERMISSIONS.BILLING_MANAGE,
          PERMISSIONS.ASSESSMENTS_CREATE,
        ])
      ).toBe(true);
    });

    it('returns false if role has none of the required permissions', () => {
      expect(
        hasAnyPermission(ROLES.CANDIDATE, [
          PERMISSIONS.BILLING_MANAGE,
          PERMISSIONS.ASSESSMENTS_CREATE,
          PERMISSIONS.PROCTORING_VIEW,
        ])
      ).toBe(false);
    });
  });

  describe('getSidebarForRole tests', () => {
    it('returns candidate sidebar for Candidate role', () => {
      const items = getSidebarForRole(ROLES.CANDIDATE);
      expect(items.length).toBeGreaterThan(0);
      expect(items.some((i) => i.id === 'candidate-dashboard')).toBe(true);
    });

    it('returns platform sidebar for Platform Owner role', () => {
      const items = getSidebarForRole(ROLES.PLATFORM_OWNER);
      expect(items.length).toBeGreaterThan(0);
      expect(items.some((i) => i.id === 'platform-dashboard')).toBe(true);
    });

    it('returns examiner sidebar for Examiner role', () => {
      const items = getSidebarForRole(ROLES.EXAMINER);
      expect(items.length).toBeGreaterThan(0);
      expect(items.some((i) => i.id === 'org-question-bank')).toBe(true);
    });
  });
});
