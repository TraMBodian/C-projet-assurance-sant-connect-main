import { useAuth } from '@/context/AuthContext';

/**
 * Hook centralisé pour les vérifications de rôle.
 * Usage : const { isAdmin, isClient, isPrestataire, can } = useRole();
 */
export function useRole() {
  const { user } = useAuth();
  const role = user?.role;

  return {
    isAdmin:       role === 'admin',
    isClient:      role === 'client',
    isPrestataire: role === 'prestataire',
    isAuthenticated: !!user,
    /** Vrai si le rôle actuel est dans la liste fournie */
    can: (...roles: string[]) => !!role && roles.includes(role),
  };
}
