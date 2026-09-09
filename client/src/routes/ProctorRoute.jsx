import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { ORGANIZATION_ROLES } from '../constants/roles';

/**
 * Dedicated Route Guard for Proctor / Invigilator operations
 * Allows Proctors, Organization Admins, Organization Owners, and Platform Staff.
 */
export const ProctorRoute = () => {
  const { isPlatformStaff, isLoading: authLoading } = useAuth();
  const { userRole, isLoading: orgLoading } = useOrganization();

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-accent-950 text-accent-800 dark:text-white">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPlatformStaff) {
    return <Outlet />;
  }

  const allowedRoles = [
    ORGANIZATION_ROLES.ORGANIZATION_OWNER,
    ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
    ORGANIZATION_ROLES.PROCTOR,
    'OWNER',
    'ADMIN',
    'PROCTOR',
  ];

  if (!allowedRoles.includes(userRole)) {
    if (userRole === ORGANIZATION_ROLES.CANDIDATE || userRole === 'CANDIDATE') {
      return <Navigate to="/candidate/dashboard" replace />;
    }
    return <Navigate to="/organization/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProctorRoute;
