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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      sessionStorage.removeItem('auth_token');
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = sessionStorage.getItem('auth_token');
        if (!token) return;

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
        sessionStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    sessionStorage.setItem('auth_token', response.token);
    setUser({
      id: String(response.user.id),
      email: response.user.email,
      role: response.user.role?.toLowerCase() as UserRole,
      full_name: response.user.fullName,
      fullName: response.user.fullName,
      organization: response.user.organization,
    });
  };

  const signUp = async (email: string, password: string, role: UserRole, fullName: string, organization?: string, telephone?: string, adresse?: string) => {
    const response = await apiClient.register({
      email, password, fullName,
      role: role.toUpperCase(),
      organization,
      telephone,
      adresse,
    });

    if (!response.token) {
      // Compte créé mais en attente de validation admin — pas de session ouverte
      throw new Error('PENDING_APPROVAL');
    }

    sessionStorage.setItem('auth_token', response.token);
    setUser({
      id: String(response.user.id),
      email: response.user.email,
      role: response.user.role?.toLowerCase() as UserRole,
      full_name: response.user.fullName,
      fullName: response.user.fullName,
      organization: response.user.organization,
    });
  };

  const signOut = async () => {
    sessionStorage.removeItem('auth_token');
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
