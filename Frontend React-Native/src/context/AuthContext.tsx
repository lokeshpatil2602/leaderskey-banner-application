import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, registerUser, AuthUser, AuthUserRole } from '../api/services/authService';
import { getAuthToken, removeAuthToken, saveAuthToken } from '../utils/tokenStorage';

const normalizeRole = (role?: string): AuthUserRole => {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'USER') {
    return role;
  }

  return 'USER';
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser({
        ...currentUser,
        role: normalizeRole(currentUser.role)
      });
    } catch {
      await removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const authData = await loginUser(email, password);
    await saveAuthToken(authData.token);
    setUser({
      ...authData.user,
      role: normalizeRole(authData.user.role)
    });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const authData = await registerUser(name, email, password);
    await saveAuthToken(authData.token);
    setUser({
      ...authData.user,
      role: normalizeRole(authData.user.role)
    });
  }, []);

  const logout = useCallback(async () => {
    await removeAuthToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
