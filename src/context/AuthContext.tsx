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
  photo?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signUp: (email: string, password: string, role: UserRole, fullName: string, organization?: string, telephone?: string, adresse?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePhoto: (photo: string) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PHOTO_KEY = (id: string) => `user_photo_${id}`;

function clearSession() {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('refresh_token');
}

function buildAuthUser(userData: any, photo?: string | null): AuthUser {
  const uid = String(userData.id);
  return {
    id: uid,
    email: userData.email,
    role: userData.role?.toLowerCase() as UserRole,
    full_name: userData.fullName,
    fullName: userData.fullName,
    organization: userData.organization,
    photo: photo ?? localStorage.getItem(PHOTO_KEY(uid)) ?? undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => {
      clearSession();
      setUser(null);
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
        setUser(buildAuthUser(userData));
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    sessionStorage.setItem('auth_token', response.token);
    if (response.refreshToken) {
      sessionStorage.setItem('refresh_token', response.refreshToken);
    }
    setUser(buildAuthUser(response.user));
  };

  const updatePhoto = (photo: string) => {
    setUser(prev => {
      if (!prev) return prev;
      localStorage.setItem(PHOTO_KEY(prev.id), photo);
      return { ...prev, photo };
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
    if (response.refreshToken) {
      sessionStorage.setItem('refresh_token', response.refreshToken);
    }
    setUser(buildAuthUser(response.user));
  };

  const signOut = async () => {
    clearSession();
    setUser(null);
    apiClient.logout().catch(() => {});
  };

  const value: AuthContextType = { user, loading, signUp, signIn, signOut, updatePhoto, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
