import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import organizationService from '../services/organization.service';

const OrganizationContext = createContext(null);

export const OrganizationProvider = ({ children }) => {
  const { isAuthenticated, user, isPlatformStaff } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch memberships / organizations for authenticated user
  const fetchMemberships = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setCurrentMembership(null);
      return;
    }

    setIsLoading(true);
    try {
      let orgs = [];

      // 1. If user object already has verified memberships from login/me, load them first
      if (user?.memberships && Array.isArray(user.memberships) && user.memberships.length > 0) {
        orgs = user.memberships.map((m) => m.organization || m.organizationId).filter(Boolean);
      }

      // 2. Query organization service for latest tenant list
      try {
        const res = await organizationService.getOrganizations();
        let fetchedList = [];
        if (Array.isArray(res)) {
          fetchedList = res;
        } else if (Array.isArray(res?.items)) {
          fetchedList = res.items;
        } else if (Array.isArray(res?.organizations)) {
          fetchedList = res.organizations;
        } else if (Array.isArray(res?.memberships)) {
          fetchedList = res.memberships;
        } else if (res?.data && Array.isArray(res.data)) {
          fetchedList = res.data;
        } else if (res?.data?.items && Array.isArray(res.data.items)) {
          fetchedList = res.data.items;
        }

        if (fetchedList.length > 0) {
          orgs = fetchedList;
        }
      } catch (err) {
        console.warn('Could not fetch organizations from backend:', err.message);
      }

      // 3. Fallback only if absolutely no organizations exist
      if (!orgs || orgs.length === 0) {
        orgs = user?.memberships || [];
      }

      setOrganizations(orgs);

      // Resolve active organization
      const storedOrgId = localStorage.getItem('secureassess_current_org_id');
      let active = null;

      if (storedOrgId && orgs.length > 0) {
        active = orgs.find(
          (o) => (o.organization?._id || o.organization?.id || o._id || o.id) === storedOrgId
        );
      }

      if (!active && orgs.length > 0) {
        active = orgs[0];
      }

      if (active) {
        const orgData = active.organization || active;
        const orgId = orgData._id || orgData.id;
        setCurrentOrganization(orgData);
        setCurrentMembership(active.organization ? active : user?.memberships?.[0] || null);

        if (orgId && typeof orgId === 'string' && !orgId.startsWith('org-') && !isPlatformStaff) {
          localStorage.setItem('secureassess_current_org_id', orgId);
        }
      } else {
        setCurrentOrganization(null);
        setCurrentMembership(null);
        if (isPlatformStaff) {
          localStorage.removeItem('secureassess_current_org_id');
        }
      }
    } catch (err) {
      console.warn('Failed to load organization context:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isPlatformStaff, user]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  /**
   * Switch active organization tenant
   */
  const switchOrganization = async (orgId) => {
    try {
      const switchRes = await organizationService.switchOrganization(orgId);
      if (switchRes?.accessToken || switchRes?.tokens?.accessToken) {
        const token = switchRes.accessToken || switchRes.tokens.accessToken;
        localStorage.setItem('secureassess_access_token', token);
      }
    } catch (e) {
      console.warn('Backend switch call note:', e.message);
    }

    const selected = organizations.find(
      (o) => (o.organization?._id || o.organization?.id || o._id || o.id) === orgId
    );
    if (selected) {
      const orgData = selected.organization || selected;
      setCurrentOrganization(orgData);
      setCurrentMembership(selected.organization ? selected : null);
      const idToStore = orgData._id || orgData.id;
      if (idToStore && typeof idToStore === 'string' && !idToStore.startsWith('org-')) {
        localStorage.setItem('secureassess_current_org_id', idToStore);
      }
      return orgData;
    }
    return null;
  };

  const userRole =
    (isPlatformStaff ? user?.platformRole : null) ||
    currentMembership?.roleId?.name ||
    currentMembership?.role?.name ||
    (typeof currentMembership?.roleId === 'string' ? currentMembership.roleId : null) ||
    currentMembership?.roleName ||
    user?.memberships?.[0]?.roleId?.name ||
    user?.memberships?.[0]?.role?.name ||
    user?.memberships?.[0]?.roleName ||
    user?.role ||
    user?.platformRole;

  const normalizedUserRole = (userRole || '').toUpperCase();

  const isPlatformAdminUser =
    isPlatformStaff ||
    user?.platformRole === 'PLATFORM_OWNER' ||
    user?.platformRole === 'PLATFORM_ADMIN';

  const isOrgAdminUser =
    normalizedUserRole === 'ORGANIZATION_OWNER' ||
    normalizedUserRole === 'ORGANIZATION_ADMIN' ||
    normalizedUserRole === 'OWNER' ||
    normalizedUserRole === 'ADMIN';

  const permissions =
    currentMembership?.roleId?.permissions ||
    currentMembership?.role?.permissions ||
    user?.permissions ||
    [];

  const hasPermission = (permissionKey) => {
    if (isPlatformAdminUser || isOrgAdminUser) return true;
    if (!permissions || permissions.length === 0) {
      if (normalizedUserRole === 'EXAMINER') {
        const examinerDefaults = [
          'assessments.view',
          'assessments.create',
          'question_banks.view',
          'candidates.view',
          'evaluations.view',
          'interviews.view',
          'reports.view',
        ];
        return examinerDefaults.includes(permissionKey);
      }
      if (normalizedUserRole === 'PROCTOR') {
        const proctorDefaults = ['proctoring.view', 'interviews.view'];
        return proctorDefaults.includes(permissionKey);
      }
      return true;
    }
    return permissions.some((p) =>
      typeof p === 'string' ? p === permissionKey : p.key === permissionKey || p.name === permissionKey
    );
  };

  const value = {
    organizations,
    currentOrganization: currentOrganization || organizations?.[0] || null,
    currentMembership,
    currentOrgId: currentOrganization?._id || currentOrganization?.id || null,
    userRole,
    permissions,
    hasPermission,
    isLoading,
    switchOrganization,
    refreshOrganizations: fetchMemberships,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export default OrganizationContext;
