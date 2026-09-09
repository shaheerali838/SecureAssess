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

        if (orgId && typeof orgId === 'string' && !orgId.startsWith('org-')) {
          localStorage.setItem('secureassess_current_org_id', orgId);
        }
      } else {
        setCurrentOrganization(null);
        setCurrentMembership(null);
        localStorage.removeItem('secureassess_current_org_id');
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

  const resolveRoleName = (source) => {
    if (!source) return null;
    if (typeof source === 'object') {
      const candidate = source.name || source.roleName || source.role || source.platformRole;
      if (candidate && typeof candidate === 'string') return candidate;
    }
    if (typeof source === 'string') {
      const upper = source.toUpperCase();
      // If it looks like a 24-char ObjectId and is not a recognized role, skip it
      if (/^[0-9a-fA-F]{24}$/.test(source) && !['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'EXAMINER', 'PROCTOR', 'CANDIDATE'].includes(upper)) {
        return null;
      }
      return source;
    }
    return null;
  };

  const matchedMembership =
    user?.memberships?.find((m) => {
      const mOrgId = m.organizationId?._id || m.organizationId?.id || m.organizationId || m.organization?._id || m.organization?.id;
      const curId = currentOrganization?._id || currentOrganization?.id;
      return mOrgId && curId && mOrgId.toString() === curId.toString();
    }) ||
    currentMembership ||
    user?.memberships?.[0] ||
    null;

  const userRole =
    (isPlatformStaff ? resolveRoleName(user?.platformRole) : null) ||
    resolveRoleName(matchedMembership?.role) ||
    resolveRoleName(matchedMembership?.roleId) ||
    resolveRoleName(matchedMembership?.roleName) ||
    resolveRoleName(currentMembership?.role) ||
    resolveRoleName(currentMembership?.roleId) ||
    resolveRoleName(currentMembership?.roleName) ||
    resolveRoleName(user?.memberships?.[0]?.role) ||
    resolveRoleName(user?.memberships?.[0]?.roleId) ||
    resolveRoleName(user?.memberships?.[0]?.roleName) ||
    resolveRoleName(user?.role) ||
    resolveRoleName(user?.platformRole);

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
    matchedMembership?.roleId?.permissions ||
    matchedMembership?.role?.permissions ||
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
