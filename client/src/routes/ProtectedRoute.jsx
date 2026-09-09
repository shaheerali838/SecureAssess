import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  ROLE_SCOPES,
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
} from "@/constants/roles";
import { hasPermission, hasAnyPermission } from "@/config/rbac.config";

/**
 * Enterprise Multi-Tenant Protected Route Wrapper
 * Enforces:
 * 1. Active Session Authentication
 * 2. Scope-level Isolation (PLATFORM vs. ORGANIZATION)
 * 3. Granular Role-Based Access Control (allowedRoles)
 * 4. Fine-grained Permission Verification (requiredPermissions)
 *
 * @param {Object} props
 * @param {string} [props.scope] - Optional scope constraint ('PLATFORM' | 'ORGANIZATION')
 * @param {string[]} [props.allowedRoles] - Optional array of authorized role identifiers
 * @param {string[]} [props.requiredPermissions] - Optional array of required permission keys
 * @param {string} [props.redirectTo] - Optional fallback redirect URL (defaults to '/forbidden')
 * @param {React.ReactNode} [props.children] - Optional nested child elements
 */
export const ProtectedRoute = ({
  scope,
  allowedRoles = [],
  requiredPermissions = [],
  redirectTo = "/forbidden",
  children,
}) => {
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    isPlatformStaff,
  } = useAuth();
  const {
    userRole,
    currentMembership,
    isLoading: orgLoading,
  } = useOrganization();
  const location = useLocation();

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-400">
            Validating SecureAssess Security Context...
          </p>
        </div>
      </div>
    );
  }

  // 1. Enforce Authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const resolveRoleName = (source) => {
    if (!source) return null;
    if (typeof source === "object") {
      const candidate =
        source.name || source.roleName || source.role || source.platformRole;
      if (candidate && typeof candidate === "string") return candidate;
    }
    if (typeof source === "string") {
      const upper = source.toUpperCase();
      if (
        /^[0-9a-fA-F]{24}$/.test(source) &&
        ![
          "ORGANIZATION_OWNER",
          "ORGANIZATION_ADMIN",
          "EXAMINER",
          "PROCTOR",
          "CANDIDATE",
        ].includes(upper)
      ) {
        return null;
      }
      return source;
    }
    return null;
  };

  const isPlatformUser = Boolean(
    isPlatformStaff ||
    user?.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
    user?.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
    user?.role === PLATFORM_ROLES.PLATFORM_ADMIN ||
    user?.role === PLATFORM_ROLES.PLATFORM_OWNER,
  );

  const activeRolesSet = new Set();

  // Add platform role if present
  const pRole = resolveRoleName(user?.platformRole);
  if (pRole) activeRolesSet.add(pRole.toUpperCase());

  // Add direct user role if present
  const uRole = resolveRoleName(user?.role);
  if (uRole) activeRolesSet.add(uRole.toUpperCase());

  // Add userRole from organization context
  const ctxRole = resolveRoleName(userRole);
  if (ctxRole) activeRolesSet.add(ctxRole.toUpperCase());

  // Add current membership role
  const cmRole =
    resolveRoleName(currentMembership?.role) ||
    resolveRoleName(currentMembership?.roleId) ||
    resolveRoleName(currentMembership?.roleName);
  if (cmRole) activeRolesSet.add(cmRole.toUpperCase());

  // Add all membership roles from user.memberships
  if (Array.isArray(user?.memberships)) {
    user.memberships.forEach((m) => {
      const mRole =
        resolveRoleName(m?.role) ||
        resolveRoleName(m?.roleId) ||
        resolveRoleName(m?.roleName);
      if (mRole) activeRolesSet.add(mRole.toUpperCase());
    });
  }

  const activeRoles = Array.from(activeRolesSet);
  const normalizedOrgRole =
    activeRoles.find((r) => r !== "PLATFORM_OWNER" && r !== "PLATFORM_ADMIN") ||
    activeRoles[0] ||
    "";

  // 2. Enforce Scope Isolation
  if (scope === ROLE_SCOPES.PLATFORM) {
    if (!isPlatformUser) {
      if (activeRoles.includes(ORGANIZATION_ROLES.CANDIDATE)) {
        return <Navigate to="/candidate/dashboard" replace />;
      }
      return <Navigate to="/organization/dashboard" replace />;
    }
  }

  if (scope === ROLE_SCOPES.ORGANIZATION) {
    // If Candidate attempts to access general organization staff routes without candidate authorization
    if (
      !isPlatformUser &&
      activeRoles.includes(ORGANIZATION_ROLES.CANDIDATE) &&
      !activeRoles.some((r) =>
        [
          ORGANIZATION_ROLES.ORGANIZATION_OWNER,
          ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
          ORGANIZATION_ROLES.EXAMINER,
          ORGANIZATION_ROLES.PROCTOR,
        ].includes(r),
      ) &&
      allowedRoles.length > 0 &&
      !allowedRoles.includes(ORGANIZATION_ROLES.CANDIDATE)
    ) {
      return <Navigate to="/candidate/dashboard" replace />;
    }
  }

  // 3. Enforce Specific Allowed Roles
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const hasRoleAccess = allowedRoles.some(
      (role) =>
        activeRoles.includes(role.toUpperCase()) ||
        (isPlatformUser &&
          (role === PLATFORM_ROLES.PLATFORM_ADMIN ||
            role === PLATFORM_ROLES.PLATFORM_OWNER)),
    );

    if (!hasRoleAccess) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // 4. Enforce Required Permissions (if specified)
  if (Array.isArray(requiredPermissions) && requiredPermissions.length > 0) {
    const roleForPermCheck = isPlatformUser
      ? PLATFORM_ROLES.PLATFORM_ADMIN
      : normalizedOrgRole;
    const hasAllPermissions = requiredPermissions.every((perm) =>
      hasPermission(roleForPermCheck, perm),
    );

    if (!hasAllPermissions) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
