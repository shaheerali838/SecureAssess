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

    try {
      const data = await authService.getMe();
      const verifiedUser = data.user || data;
      setUser(verifiedUser);
      localStorage.setItem('secureassess_user', JSON.stringify(verifiedUser));
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
      const data = await authService.login(email, password);
      const authUser = data.user || data;
      const token = data.tokens?.accessToken || data.accessToken || data.token;
      const refreshToken = data.tokens?.refreshToken || data.refreshToken;

      setUser(authUser);
      setAccessToken(token);

      localStorage.setItem('secureassess_user', JSON.stringify(authUser));
      if (token) {
        localStorage.setItem('secureassess_access_token', token);
      }
      if (refreshToken) {
        localStorage.setItem('secureassess_refresh_token', refreshToken);
      }

      return authUser;
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
    } finally {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
    }
  };

  const isPlatformStaff = Boolean(
    user &&
      (user.platformRole === PLATFORM_ROLES.PLATFORM_OWNER ||
        user.platformRole === PLATFORM_ROLES.PLATFORM_ADMIN)
  );

  const value = {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isLoading,
    isPlatformStaff,
    login,
    logout,
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
