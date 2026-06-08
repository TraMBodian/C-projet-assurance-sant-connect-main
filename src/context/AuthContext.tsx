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
  telephone?: string;
  adresse?: string;
  created_at?: string;
  updated_at?: string;
  photo?: string;
}

export interface MyPrestataire {
  id: number;
  nom: string;
  type: string;
  email: string;
  telephone?: string;
  adresse?: string;
  numero?: string;
  statut?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  myPrestataire: MyPrestataire | null;
  loadingPrestataire: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
    organization?: string,
    telephone?: string,
    adresse?: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePhoto: (photo: string) => void;
  updateUser: (data: Partial<AuthUser>) => void;
  refreshMyPrestataire: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PHOTO_KEY = (id: string) => `user_photo_${id}`;

function buildAuthUser(userData: any): AuthUser {
  const uid = String(userData.id);
  return {
    id:           uid,
    email:        userData.email,
    role:         userData.role?.toLowerCase() as UserRole,
    full_name:    userData.fullName,
    fullName:     userData.fullName,
    organization: userData.organization,
    telephone:    userData.telephone,
    adresse:      userData.adresse,
    photo:        localStorage.getItem(PHOTO_KEY(uid)) ?? undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]                         = useState<AuthUser | null>(null);
  const [myPrestataire, setMyPrestataire]       = useState<MyPrestataire | null>(null);
  const [loadingPrestataire, setLoadingPrestataire] = useState(false);
  const [loading, setLoading]                   = useState(true);

  // ─── Écoute l'événement d'expiration de session ───────────────────────────
  useEffect(() => {
    const handler = () => {
      apiClient.setToken(null);
      setUser(null);
      setMyPrestataire(null);
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  // ─── Charge le prestataire lié au compte (une seule fois après login) ─────
  const loadMyPrestataire = async () => {
    setLoadingPrestataire(true);
    try {
      const data = await apiClient.getMyPrestataire();
      setMyPrestataire(data ?? null);
    } catch {
      setMyPrestataire(null);
    } finally {
      setLoadingPrestataire(false);
    }
  };

  const refreshMyPrestataire = async () => {
    await loadMyPrestataire();
  };

  // ─── Restauration de session au démarrage ────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        await apiClient.tryRefresh();
        const userData = await apiClient.getCurrentUser();
        const authUser = buildAuthUser(userData);
        setUser(authUser);
        if (authUser.role === 'prestataire') {
          await loadMyPrestataire();
        }
      } catch {
        apiClient.setToken(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ─── Connexion ────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    apiClient.setToken(response.token);
    const authUser = buildAuthUser(response.user);
    setUser(authUser);
    if (authUser.role === 'prestataire') {
      await loadMyPrestataire();
    }
  };

  // ─── Inscription ──────────────────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    fullName: string,
    organization?: string,
    telephone?: string,
    adresse?: string
  ) => {
    const response = await apiClient.register({
      email, password, fullName,
      role: role.toUpperCase(),
      organization, telephone, adresse,
    });

    if (!response.token) {
      throw new Error('PENDING_APPROVAL');
    }

    apiClient.setToken(response.token);
    const authUser = buildAuthUser(response.user);
    setUser(authUser);
    if (authUser.role === 'prestataire') {
      await loadMyPrestataire();
    }
  };

  // ─── Déconnexion ──────────────────────────────────────────────────────────
  const signOut = async () => {
    apiClient.setToken(null);
    setUser(null);
    setMyPrestataire(null);
    apiClient.logout().catch(() => {});
  };

  // ─── Photo ────────────────────────────────────────────────────────────────
  const updatePhoto = (photo: string) => {
    setUser(prev => {
      if (!prev) return prev;
      localStorage.setItem(PHOTO_KEY(prev.id), photo);
      return { ...prev, photo };
    });
  };

  // ─── Mise à jour locale du profil ─────────────────────────────────────────
  const updateUser = (data: Partial<AuthUser>) => {
    setUser(prev => (prev ? { ...prev, ...data } : prev));
  };

  const value: AuthContextType = {
    user,
    myPrestataire,
    loadingPrestataire,
    loading,
    signUp,
    signIn,
    signOut,
    updatePhoto,
    updateUser,
    refreshMyPrestataire,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
