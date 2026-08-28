import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { ORGANIZATION_ROLES } from '../constants/roles';

export const CandidateRoute = () => {
  const { isPlatformStaff } = useAuth();
  const { userRole, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-900 text-white">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Allow candidates or platform staff to enter candidate test-taking views
  if (!isPlatformStaff && userRole && userRole !== ORGANIZATION_ROLES.CANDIDATE) {
    // If user is an admin/examiner, let them view or redirect to org dashboard
    return <Navigate to="/organization/dashboard" replace />;
  }

  return <Outlet />;
};

export default CandidateRoute;
