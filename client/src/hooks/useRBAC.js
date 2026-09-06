import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import {
  ROLE_SCOPES,
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
} from '@/constants/roles';

/**
 * Custom Hook for Component-Level Role-Based Access Control (RBAC)
 * Provides granular role, scope, and permission validation utilities.
 */
export const useRBAC = () => {
  const { user, isPlatformStaff } = useAuth();
  const { userRole, permissions, hasPermission: orgHasPermission } = useOrganization();

  const isPlatformUser = Boolean(
    isPlatformStaff ||
      user?.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
      user?.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
      user?.role === PLATFORM_ROLES.PLATFORM_ADMIN ||
      user?.role === PLATFORM_ROLES.PLATFORM_OWNER
  );

  const effectiveRole = (
    userRole ||
    user?.role ||
    user?.memberships?.[0]?.roleId?.name ||
    user?.memberships?.[0]?.role?.name ||
    user?.memberships?.[0]?.roleName ||
    ''
  ).toUpperCase();

  const currentScope = isPlatformUser
    ? ROLE_SCOPES.PLATFORM
    : ROLE_SCOPES.ORGANIZATION;

  /**
   * Check if current user has a specific role or any role from a list
   * @param {string|string[]} roles
   * @returns {boolean}
   */
  const hasRole = (roles) => {
    if (!roles) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.some(
      (r) =>
        r === effectiveRole ||
        (isPlatformUser && r === PLATFORM_ROLES.PLATFORM_ADMIN) ||
        (isPlatformUser && r === PLATFORM_ROLES.PLATFORM_OWNER)
    );
  };

  /**
   * Check if current user is within a specific scope
   * @param {string} scope ('PLATFORM' | 'ORGANIZATION')
   * @returns {boolean}
   */
  const hasScope = (scope) => {
    return currentScope === scope;
  };

  /**
   * Check if current user has a specific permission
   * @param {string} permissionKey
   * @returns {boolean}
   */
  const hasPermission = (permissionKey) => {
    if (isPlatformUser) return true;
    if (typeof orgHasPermission === 'function') {
      return orgHasPermission(permissionKey);
    }
    return permissions?.includes(permissionKey) || false;
  };

  return {
    user,
    effectiveRole,
    currentScope,
    isPlatformUser,
    isOrgOwner: effectiveRole === ORGANIZATION_ROLES.ORGANIZATION_OWNER,
    isOrgAdmin: effectiveRole === ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
    isExaminer: effectiveRole === ORGANIZATION_ROLES.EXAMINER,
    isProctor: effectiveRole === ORGANIZATION_ROLES.PROCTOR,
    isCandidate: effectiveRole === ORGANIZATION_ROLES.CANDIDATE,
    hasRole,
    hasScope,
    hasPermission,
  };
};

export default useRBAC;
