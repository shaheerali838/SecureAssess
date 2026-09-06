import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { ORGANIZATION_ROLES } from '../constants/roles';

export const OrganizationRoute = () => {
  const { user, isPlatformStaff } = useAuth();
  const { userRole, currentMembership, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-accent-950 text-accent-800 dark:text-white">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const effectiveRole =
    userRole ||
    currentMembership?.roleId?.name ||
    currentMembership?.role?.name ||
    currentMembership?.roleName ||
    user?.memberships?.[0]?.roleId?.name ||
    user?.memberships?.[0]?.role?.name ||
    user?.memberships?.[0]?.roleName;

  // Candidates should be directed to the candidate portal instead
  if (
    !isPlatformStaff &&
    (effectiveRole === ORGANIZATION_ROLES.CANDIDATE ||
      effectiveRole === 'CANDIDATE' ||
      user?.memberships?.some(
        (m) =>
          (m.roleId?.name || m.role?.name || m.roleName) === ORGANIZATION_ROLES.CANDIDATE ||
          (m.roleId?.name || m.role?.name || m.roleName) === 'CANDIDATE'
      ))
  ) {
    return <Navigate to="/candidate/dashboard" replace />;
  }

  return <Outlet />;
};

export default OrganizationRoute;
