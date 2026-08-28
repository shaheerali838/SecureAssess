import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { ORGANIZATION_ROLES } from '../constants/roles';

export const PlatformRoute = () => {
  const { isPlatformStaff, isLoading } = useAuth();
  const { userRole } = useOrganization();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-accent-950 text-accent-800 dark:text-white">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not platform staff, smartly redirect to their organization or candidate workspace
  if (!isPlatformStaff) {
    if (userRole === ORGANIZATION_ROLES.CANDIDATE) {
      return <Navigate to="/candidate/system-check" replace />;
    }
    return <Navigate to="/organization/dashboard" replace />;
  }

  return <Outlet />;
};

export default PlatformRoute;
