import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import organizationService from '../services/organization.service';
import { organizations as staticOrganizations } from '@/data';

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
      try {
        const res = await organizationService.getOrganizations();
        if (Array.isArray(res)) {
          orgs = res;
        } else if (Array.isArray(res?.items)) {
          orgs = res.items;
        } else if (Array.isArray(res?.organizations)) {
          orgs = res.organizations;
        } else if (Array.isArray(res?.memberships)) {
          orgs = res.memberships;
        } else if (res?.data && Array.isArray(res.data)) {
          orgs = res.data;
        } else if (res?.data?.items && Array.isArray(res.data.items)) {
          orgs = res.data.items;
        }
      } catch (err) {
        console.warn('Could not fetch organizations from backend, using fallback:', err.message);
      }

      // If backend returned no orgs or failed, merge with default Stanford Engineering fallback
      if (!orgs || orgs.length === 0) {
        orgs = staticOrganizations || [
          {
            _id: 'org-stanford',
            id: 'org-stanford',
            name: 'Stanford Engineering',
            slug: 'stanford-engineering',
            code: 'STANFORD',
            brandColor: '#4f46e5',
            status: 'ACTIVE',
          },
        ];
      }

      setOrganizations(orgs);

      // Restore stored current organization or default to first
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
        setCurrentOrganization(orgData);
        setCurrentMembership(active.organization ? active : null);
        const orgIdToStore = orgData._id || orgData.id || 'org-stanford';
        localStorage.setItem('secureassess_current_org_id', orgIdToStore);
      }
    } catch (err) {
      console.warn('Failed to load organization context:', err.message);
      if (staticOrganizations && staticOrganizations.length > 0) {
        setCurrentOrganization(staticOrganizations[0]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isPlatformStaff]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  /**
   * Switch active organization tenant
   */
  const switchOrganization = (orgId) => {
    const selected = organizations.find(
      (o) => (o.organization?._id || o.organization?.id || o._id || o.id) === orgId
    );
    if (selected) {
      const orgData = selected.organization || selected;
      setCurrentOrganization(orgData);
      setCurrentMembership(selected.organization ? selected : null);
      const idToStore = orgData._id || orgData.id;
      if (idToStore) {
        localStorage.setItem('secureassess_current_org_id', idToStore);
      }
      return orgData;
    }
    return null;
  };

  const userRole =
    currentMembership?.roleId?.name ||
    currentMembership?.roleName ||
    (isPlatformStaff ? user?.platformRole : 'ORGANIZATION_ADMIN');
  const permissions = currentMembership?.roleId?.permissions || [];

  const hasPermission = (permissionKey) => {
    if (isPlatformStaff) return true;
    return permissions.some((p) =>
      typeof p === 'string' ? p === permissionKey : p.key === permissionKey
    );
  };

  const value = {
    organizations,
    currentOrganization: currentOrganization || staticOrganizations?.[0] || null,
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
