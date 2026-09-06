import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  ROLE_SCOPES,
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
} from '@/constants/roles';

/**
 * Enhanced Multi-Tenant Protected Route Wrapper
 * Enforces:
 * 1. Active Authentication
 * 2. Scope-level Isolation (PLATFORM vs. ORGANIZATION)
 * 3. Strict Role-Based Access Control (allowedRoles)
 *
 * @param {Object} props
 * @param {string} [props.scope] - Optional scope constraint ('PLATFORM' | 'ORGANIZATION')
 * @param {string[]} [props.allowedRoles] - Optional array of authorized role identifiers
 * @param {React.ReactNode} [props.children] - Optional nested child elements
 */
export const ProtectedRoute = ({ scope, allowedRoles = [], children }) => {
  const { isAuthenticated, isLoading: authLoading, user, isPlatformStaff } = useAuth();
  const { userRole, currentMembership, isLoading: orgLoading } = useOrganization();
  const location = useLocation();

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-400">
            Validating SecureAssess Credentials...
          </p>
        </div>
      </div>
    );
  }

  // 1. Enforce Authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isPlatformUser = Boolean(
    isPlatformStaff ||
      user?.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
      user?.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      user?.role === PLATFORM_ROLES.PLATFORM_ADMIN ||
      user?.role === PLATFORM_ROLES.PLATFORM_OWNER
  );

  const effectiveOrgRole =
    userRole ||
    currentMembership?.roleId?.name ||
    currentMembership?.role?.name ||
    currentMembership?.roleName ||
    user?.memberships?.[0]?.roleId?.name ||
    user?.memberships?.[0]?.role?.name ||
    user?.memberships?.[0]?.roleName ||
    user?.role;

  const normalizedOrgRole = (effectiveOrgRole || '').toUpperCase();

  // 2. Enforce Scope Isolation
  if (scope === ROLE_SCOPES.PLATFORM) {
    if (!isPlatformUser) {
      if (normalizedOrgRole === ORGANIZATION_ROLES.CANDIDATE) {
        return <Navigate to="/candidate/dashboard" replace />;
      }
      return <Navigate to="/organization/dashboard" replace />;
    }
  }

  if (scope === ROLE_SCOPES.ORGANIZATION) {
    // If Candidate attempts to access general organization staff routes without candidate authorization
    if (
      !isPlatformUser &&
      normalizedOrgRole === ORGANIZATION_ROLES.CANDIDATE &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(ORGANIZATION_ROLES.CANDIDATE)
    ) {
      return <Navigate to="/candidate/dashboard" replace />;
    }
  }

  // 3. Enforce Specific Allowed Roles
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const activeRoles = [
      user?.platformRole,
      user?.role,
      normalizedOrgRole,
    ].filter(Boolean);

    const hasAccess = allowedRoles.some((role) =>
      activeRoles.includes(role) || (isPlatformUser && role === PLATFORM_ROLES.PLATFORM_ADMIN)
    );

    if (!hasAccess) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
