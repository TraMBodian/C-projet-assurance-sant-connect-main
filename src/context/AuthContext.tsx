import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '@/services/apiClient';

export type UserRole = 'admin' | 'prestataire' | 'client';

export interface AuthUser {
  id: string;
  email: string;
  role?: UserRole;
  full_name?: string;
  fullName?: string;
  organization?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole, fullName: string, organization?: string, telephone?: string, adresse?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

// Fallback local (quand backend indisponible)
const FALLBACK_ACCOUNTS: Record<string, { id: string; email: string; role: UserRole; full_name: string; password: string }> = {
  'bodianm372@gmail.com': { id: '1', email: 'bodianm372@gmail.com', role: 'admin', full_name: 'Administrateur Bodian',    password: 'admin1' },
  'bassniang7@yahoo.fr':  { id: '2', email: 'bassniang7@yahoo.fr',  role: 'admin', full_name: 'Administrateur Bassniang', password: 'admin1' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Déconnexion automatique si le token expire (401 reçu par l'API)
  useEffect(() => {
    const handler = () => {
      setUser(null);
      localStorage.removeItem('auth_token');
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        // Token local (mode sans backend)
        if (token.startsWith('local-token-')) {
          const userId = token.replace('local-token-', '');
          const fixedUser = Object.values(FALLBACK_ACCOUNTS).find(u => u.id === userId);
          if (fixedUser) {
            const { password: _, ...u } = fixedUser;
            setUser(u);
            return;
          }
          const saved: any[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
          const found = saved.find((u: any) => u.id === userId);
          if (found) {
            const { password: _, ...u } = found;
            setUser(u);
          }
          return;
        }

        // Token backend JWT — /auth/me retourne UserDto directement
        const userData = await apiClient.getCurrentUser();
        setUser({
          id: String(userData.id),
          email: userData.email,
          role: userData.role?.toLowerCase() as UserRole,
          full_name: userData.fullName,
          fullName: userData.fullName,
          organization: userData.organization,
        });
      } catch {
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    // 1. Essayer le backend
    try {
      const response = await apiClient.login({ email, password });
      localStorage.setItem('auth_token', response.token);
      setUser({
        id: String(response.user.id),
        email: response.user.email,
        role: response.user.role?.toLowerCase() as UserRole,
        full_name: response.user.fullName,
        fullName: response.user.fullName,
        organization: response.user.organization,
      });
      return;
    } catch {
      // Backend indisponible ou identifiants incorrects → essayer le fallback local
    }

    // 2. Fallback local (admin hardcodés ou comptes enregistrés localement)
    const fallback = FALLBACK_ACCOUNTS[email];
    if (fallback && fallback.password === password) {
      const { password: _, ...u } = fallback;
      localStorage.setItem('auth_token', `local-token-${fallback.id}`);
      setUser(u);
      return;
    }

    const saved: any[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const found = saved.find((u: any) => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...u } = found;
      localStorage.setItem('auth_token', `local-token-${found.id}`);
      setUser(u);
      return;
    }

    throw new Error('Email ou mot de passe incorrect');
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName: string, organization?: string, telephone?: string, adresse?: string) => {
    // 1. Essayer l'inscription via le backend
    try {
      const response = await apiClient.register({
        email, password, fullName,
        role: role.toUpperCase(),
        organization,
        telephone,
        adresse,
      });
      localStorage.setItem('auth_token', response.token);
      setUser({
        id: String(response.user.id),
        email: response.user.email,
        role: response.user.role?.toLowerCase() as UserRole,
        full_name: response.user.fullName,
        fullName: response.user.fullName,
        organization: response.user.organization,
      });
      return;
    } catch (backendError: any) {
      const isNetworkError =
        backendError.message?.includes('fetch') ||
        backendError.message?.includes('timeout') ||
        backendError.message?.includes('Failed to fetch');

      if (!isNetworkError) {
        throw new Error(backendError.message || "Erreur lors de l'inscription");
      }
    }

    // 2. Fallback local si backend indisponible
    if (FALLBACK_ACCOUNTS[email]) throw new Error('Cet email est déjà utilisé');
    const saved: any[] = JSON.parse(localStorage.getItem('registered_users') || '[]');
    if (saved.find((u: any) => u.email === email)) throw new Error('Cet email est déjà utilisé');

    const newUser = {
      id: Date.now().toString(),
      email, password, role,
      full_name: fullName,
      organization: organization || '',
      created_at: new Date().toISOString(),
    };
    saved.push(newUser);
    localStorage.setItem('registered_users', JSON.stringify(saved));

    const { password: _, ...u } = newUser;
    localStorage.setItem('auth_token', `local-token-${newUser.id}`);
    setUser(u);
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    apiClient.logout().catch(() => {});
  };

  const value: AuthContextType = { user, loading, signUp, signIn, signOut, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
