import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { ORGANIZATION_ROLES } from '../constants/roles';

export const PublicRoute = () => {
  const { isAuthenticated, isPlatformStaff, isLoading } = useAuth();
  const { userRole } = useOrganization();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-900 text-white">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If already authenticated, route automatically to the right portal
  if (isAuthenticated) {
    if (isPlatformStaff) {
      return <Navigate to="/platform/dashboard" replace />;
    }
    if (userRole === ORGANIZATION_ROLES.CANDIDATE) {
      return <Navigate to="/candidate/dashboard" replace />;
    }
    return <Navigate to="/organization/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
