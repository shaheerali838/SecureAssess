import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';
import { PLATFORM_ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('secureassess_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem('secureassess_access_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify authentication state on mount
  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem('secureassess_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    const resolveRoleName = (source) => {
      if (!source) return null;
      if (typeof source === 'object') {
        const candidate = source.name || source.roleName || source.role || source.platformRole;
        if (candidate && typeof candidate === 'string') return candidate;
      }
      if (typeof source === 'string') {
        const upper = source.toUpperCase();
        if (/^[0-9a-fA-F]{24}$/.test(source) && !['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'EXAMINER', 'PROCTOR', 'CANDIDATE'].includes(upper)) {
          return null;
        }
        return source;
      }
      return null;
    };

    try {
      const data = await authService.getMe();
      const verifiedUser = data.user || data;
      const memberships = data.memberships || [];
      const primaryRole =
        resolveRoleName(verifiedUser.platformRole) ||
        resolveRoleName(memberships[0]?.role) ||
        resolveRoleName(memberships[0]?.roleId) ||
        resolveRoleName(memberships[0]?.roleName) ||
        resolveRoleName(verifiedUser.role) ||
        null;
      const userObject = { ...verifiedUser, memberships, role: primaryRole };
      setUser(userObject);
      localStorage.setItem('secureassess_user', JSON.stringify(userObject));
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.message);
      authService.logout();
      setUser(null);
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Handle user login
   */
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Clear previous organization context to prevent tenant leakage
      localStorage.removeItem('secureassess_current_org_id');

      const resolveRoleName = (source) => {
        if (!source) return null;
        if (typeof source === 'object') {
          const candidate = source.name || source.roleName || source.role || source.platformRole;
          if (candidate && typeof candidate === 'string') return candidate;
        }
        if (typeof source === 'string') {
          const upper = source.toUpperCase();
          if (/^[0-9a-fA-F]{24}$/.test(source) && !['ORGANIZATION_OWNER', 'ORGANIZATION_ADMIN', 'EXAMINER', 'PROCTOR', 'CANDIDATE'].includes(upper)) {
            return null;
          }
          return source;
        }
        return null;
      };

      const data = await authService.login(email, password);
      const authUser = data.user || data;
      const token = data.tokens?.accessToken || data.accessToken || data.token;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;
      const memberships = data.memberships || [];
      const primaryRole =
        resolveRoleName(authUser.platformRole) ||
        resolveRoleName(memberships[0]?.role) ||
        resolveRoleName(memberships[0]?.roleId) ||
        resolveRoleName(memberships[0]?.roleName) ||
        resolveRoleName(authUser.role) ||
        null;

      const userObject = { ...authUser, memberships, role: primaryRole };

      setUser(userObject);
      setAccessToken(token);

      localStorage.setItem('secureassess_user', JSON.stringify(userObject));
      if (token) {
        localStorage.setItem('secureassess_access_token', token);
      }
      if (refreshToken) {
        localStorage.setItem('secureassess_refresh_token', refreshToken);
      }

      const isStaff =
        authUser.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
        authUser.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
        authUser.platformRole === 'PLATFORM_OWNER' ||
        authUser.platformRole === 'PLATFORM_ADMIN';

      if (!isStaff && memberships.length > 0) {
        const primaryOrg = memberships[0].organizationId || memberships[0].organization;
        const orgId = typeof primaryOrg === 'object' ? (primaryOrg._id || primaryOrg.id) : primaryOrg;
        if (orgId && typeof orgId === 'string' && !orgId.startsWith('org-')) {
          localStorage.setItem('secureassess_current_org_id', orgId);
        }
      }

      return { user: userObject, memberships, tokens: data.tokens, ...data };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle user logout
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout API note:', e.message);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('secureassess_access_token');
      localStorage.removeItem('secureassess_refresh_token');
      localStorage.removeItem('secureassess_user');
      localStorage.removeItem('secureassess_current_org_id');
      setIsLoading(false);
    }
  };

  /**
   * Handle accept invitation & set password
   */
  const acceptInvitation = async ({ token, password, firstName, lastName }) => {
    setIsLoading(true);
    try {
      localStorage.removeItem('secureassess_current_org_id');

      const data = await authService.acceptInvitation({ token, password, firstName, lastName });
      const authUser = data.user || data;
      const tok = data.tokens?.accessToken || data.accessToken || data.token;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;
      const memberships = data.memberships || [];

      const userObject = { ...authUser, memberships };

      setUser(userObject);
      setAccessToken(tok);

      localStorage.setItem('secureassess_user', JSON.stringify(userObject));
      if (tok) {
        localStorage.setItem('secureassess_access_token', tok);
      }
      if (refreshToken) {
        localStorage.setItem('secureassess_refresh_token', refreshToken);
      }

      if (memberships.length > 0) {
        const primaryOrg = memberships[0].organizationId || memberships[0].organization;
        const orgId = typeof primaryOrg === 'object' ? (primaryOrg._id || primaryOrg.id) : primaryOrg;
        if (orgId && typeof orgId === 'string') {
          localStorage.setItem('secureassess_current_org_id', orgId);
        }
      }

      return { user: userObject, memberships, tokens: data.tokens, ...data };
    } finally {
      setIsLoading(false);
    }
  };

  const isPlatformStaff = Boolean(
    user &&
      (user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
        user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN ||
        user.platformRole === 'PLATFORM_OWNER' ||
        user.platformRole === 'PLATFORM_ADMIN')
  );

  const isPlatformAdmin = () => isPlatformStaff;

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isLoading,
    isPlatformStaff,
    isPlatformAdmin,
    login,
    logout,
    acceptInvitation,
    refreshSession: initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
