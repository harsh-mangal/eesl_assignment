import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, TOKEN_KEY } from '../api/client';
import type { ApiResponse, AuthUser } from '../types/api';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get<ApiResponse<AuthUser>>('/auth/me');
      if (response.data.data.role !== 'ADMIN') throw new Error('Administrator access is required.');
      setUser(response.data.data);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const login = async (identifier: string, password: string) => {
    const response = await api.post<
      ApiResponse<{ accessToken: string; user: AuthUser }>
    >('/auth/login', { identifier, password });
    if (response.data.data.user.role !== 'ADMIN') throw new Error('Use an administrator account.');
    localStorage.setItem(TOKEN_KEY, response.data.data.accessToken);
    setUser(response.data.data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
