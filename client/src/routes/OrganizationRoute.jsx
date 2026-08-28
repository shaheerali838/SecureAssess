import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { ORGANIZATION_ROLES } from '../constants/roles';

export const OrganizationRoute = () => {
  const { isPlatformStaff } = useAuth();
  const { userRole, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-accent-950 text-accent-800 dark:text-white">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Candidates should be directed to the candidate portal instead
  if (!isPlatformStaff && userRole === ORGANIZATION_ROLES.CANDIDATE) {
    return <Navigate to="/candidate/system-check" replace />;
  }

  return <Outlet />;
};

export default OrganizationRoute;
