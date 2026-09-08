import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { LoginResponse } from '../services/authService';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type UserRole = 'gestante' | 'admin' | 'clinico' | 'hospital' | null;

export interface AuthUser {
  role: UserRole;
  isAuthenticated: boolean;
}

interface AuthContextValue {
  user: AuthUser;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser>(() => {
    // Inicializar desde localStorage para persistir sesión entre recargas
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role') as UserRole;
    return {
      role: token ? role : null,
      isAuthenticated: !!token,
    };
  });

  // Sincronizar si otro tab cambia el localStorage
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'role') {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('role') as UserRole;
        setUser({
          role: token ? role : null,
          isAuthenticated: !!token,
        });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback((data: LoginResponse) => {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('role', data.role);
    setUser({
      role: data.role as UserRole,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      const authService = await import('../services/authService');
      await authService.logoutUser();
    } catch (e) {
      console.error('Failed to log out from server, clearing local storage:', e);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('role');
    } finally {
      sessionStorage.clear();
      localStorage.removeItem('selected_gestante_gmi');
      localStorage.removeItem('selected_gestante_id');
      localStorage.removeItem('user_name');
      localStorage.removeItem('codigo_gmi');
      localStorage.removeItem('consent_accepted');
    }
    setUser({ role: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
};
