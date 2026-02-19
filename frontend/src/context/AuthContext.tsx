import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, LoginCredentials, RegisterData } from '../types';
import authService from '../services/auth.service';

// ── Context shape ────────────────────────────────────────────
export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Hydrate user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await authService.getMe();
        if (response.status === 'success' && response.data) {
          setUser(response.data.user);
        }
      } catch {
        // Token is invalid or expired
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    if (response.status === 'success' && response.data) {
      const { user: loggedInUser, token: newToken } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(loggedInUser);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await authService.register(data);
    if (response.status === 'success' && response.data) {
      const { user: newUser, token: newToken } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
