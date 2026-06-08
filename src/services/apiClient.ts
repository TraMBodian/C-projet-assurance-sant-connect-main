// API Client — token stocké en mémoire (jamais dans localStorage/sessionStorage)
// Le refresh_token voyage uniquement via cookie httpOnly géré par le backend
import { toUserMessage } from '@/lib/errorMessages';

export class ApiClient {
  private baseURL: string;
  private timeout: number;

  // ─── Token en mémoire ─────────────────────────────────────────────────────
  // Inaccessible depuis la console ou un script injecté via localStorage/sessionStorage.
  // Perdu au rechargement → restauré automatiquement par tryRefresh() via cookie httpOnly.
  private accessToken: string | null = null;

  // Singleton : plusieurs requêtes 401 simultanées ne déclenchent qu'un seul appel refresh
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
    this.baseURL = envUrl ? envUrl.replace(/\/+$/, '') : '/api';
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
  }

  // ─── Gestion du token ─────────────────────────────────────────────────────

  setToken(token: string | null): void {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  hasToken(): boolean {
    return this.accessToken !== null;
  }

  // ─── Requête principale ───────────────────────────────────────────────────

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      credentials: 'include', // envoie le cookie httpOnly refresh_token automatiquement
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, { ...config, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur réseau' }));
        const msg = errorData.message || errorData.data || `HTTP ${response.status}`;

        if (response.status === 401) {
          // Endpoints auth → pas de retry (évite la récursion infinie)
          if (endpoint.includes('/auth/')) {
            throw new Error(msg);
          }

          // Autre endpoint → refresh silencieux puis retry
          try {
            const newToken = await this.tryRefresh();
            return this.request<T>(endpoint, {
              ...options,
              headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
            });
          } catch {
            this.accessToken = null;
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
        }

        if (response.status === 403) {
          window.dispatchEvent(new CustomEvent('api:forbidden', { detail: { endpoint, message: msg } }));
          throw new Error("Accès refusé. Vous n'avez pas les droits nécessaires.");
        }

        if (response.status === 429) {
          throw new Error('Trop de requêtes. Veuillez patienter avant de réessayer.');
        }

        if (response.status >= 500) {
          throw new Error("Erreur serveur. Veuillez réessayer ou contacter l'administrateur.");
        }

        // Mapper le message technique vers un message lisible pour l'utilisateur
        throw new Error(toUserMessage(msg));
      }

      const json = await response.json();
      // Le backend retourne { success, data, message } → on extrait data
      return (json && json.success !== undefined ? json.data : json) as T;

    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') throw new Error('Délai de connexion dépassé');
        if (
          error.message.includes('fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('Failed to fetch')
        ) {
          throw new Error('Failed to fetch');
        }
        throw error;
      }
      throw new Error('Erreur inconnue');
    }
  }

  // ─── Refresh silencieux ───────────────────────────────────────────────────

  async tryRefresh(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      // Le cookie httpOnly refresh_token est envoyé automatiquement (credentials:'include')
      const res = await this.request<{ token: string }>('/auth/refresh', { method: 'POST' });
      this.accessToken = res.token;
      return res.token;
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  async login(credentials: { email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    organization?: string;
    telephone?: string;
    adresse?: string;
  }) {
    return this.request<{ user: any; token: string | null }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' }).catch(() => ({}));
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationRead(dbId: number) {
    return this.request(`/notifications/${dbId}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PATCH' });
  }

  async deleteNotification(dbId: number) {
    return this.request(`/notifications/${dbId}`, { method: 'DELETE' });
  }

  async getUnreadNotificationCount(): Promise<number> {
    return this.request<number>('/notifications/unread-count');
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  async getUsers() {
    return this.request<{ users: any[] }>('/users');
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    return this.request(`/users/${id}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // ─── Assurés ──────────────────────────────────────────────────────────────

  async getAssures() {
    return this.request<{ assures: any[] }>('/assures');
  }

  async getAssureById(id: string) {
    return this.request<any>(`/assures/${id}`);
  }

  async getMesBeneficiaires() {
    return this.request<any[]>('/assures/mes-beneficiaires');
  }

  async createAssure(data: any) {
    return this.request('/assures', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateAssure(id: string, data: any) {
    return this.request(`/assures/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteAssure(id: string) {
    return this.request(`/assures/${id}`, { method: 'DELETE' });
  }

  // ─── Polices ──────────────────────────────────────────────────────────────

  async getPolices() {
    return this.request<{ polices: any[] }>('/polices');
  }

  async createPolice(data: any) {
    return this.request('/polices', { method: 'POST', body: JSON.stringify(data) });
  }

  async updatePolice(id: string, data: any) {
    return this.request(`/polices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deletePolice(id: string) {
    return this.request(`/polices/${id}`, { method: 'DELETE' });
  }

  // ─── Sinistres ────────────────────────────────────────────────────────────

  async getSinistres() {
    return this.request<{ sinistres: any[] }>('/sinistres');
  }

  async getSinistreById(id: string) {
    return this.request<any>(`/sinistres/${id}`);
  }

  async createSinistre(data: any) {
    return this.request('/sinistres', { method: 'POST', body: JSON.stringify(data) });
  }

  // ─── Prestataires ─────────────────────────────────────────────────────────

  async getPrestataires() {
    return this.request<{ prestataires: any[] }>('/prestataires');
  }

  async createPrestataire(data: any) {
    return this.request('/prestataires', { method: 'POST', body: JSON.stringify(data) });
  }

  async updatePrestataire(id: string | number, data: any) {
    return this.request(`/prestataires/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deletePrestataire(id: string | number) {
    return this.request(`/prestataires/${id}`, { method: 'DELETE' });
  }

  // ─── Consultations ────────────────────────────────────────────────────────

  async getConsultations() {
    return this.request<{ consultations: any[] }>('/consultations');
  }

  async createConsultation(data: any) {
    return this.request('/consultations', { method: 'POST', body: JSON.stringify(data) });
  }

  // ─── Prescriptions ────────────────────────────────────────────────────────

  async getPrescriptions() {
    return this.request<{ prescriptions: any[] }>('/prescriptions');
  }

  async createPrescription(data: any) {
    return this.request('/prescriptions', { method: 'POST', body: JSON.stringify(data) });
  }

  // ─── Prestations ──────────────────────────────────────────────────────────

  async getPrestations() {
    return this.request<{ prestations: any[] }>('/prestations');
  }

  async createPrestation(data: any) {
    return this.request<any>('/prestations', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMyPrestataire() {
    return this.request<any>('/prestataires/me');
  }

  async patchMyPrestataire(data: { telephone?: string; adresse?: string }) {
    return this.request<any>('/prestataires/me', { method: 'PATCH', body: JSON.stringify(data) });
  }

  async patchConsultationStatut(id: number | string, statut: string, motifAnnulation?: string) {
    return this.request<any>(`/consultations/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ statut, ...(motifAnnulation ? { motifAnnulation } : {}) }),
    });
  }

  async updateConsultation(id: number | string, data: any) {
    return this.request<any>(`/consultations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getPrestationLignes(prestationId: string) {
    return this.request<{ lignes: any[] }>(`/prestations/${prestationId}/lignes`);
  }

  async refuserLignePrestation(ligneId: string) {
    return this.request<any>(`/prestations/lignes/${ligneId}/refuser`, { method: 'POST' });
  }

  async createLignePrestation(prestationId: string, data: any) {
    return this.request<any>(`/prestations/${prestationId}/lignes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async fournirLignePrestation(ligneId: string, data: { prestataireId: number; prescriptionId?: number | null }) {
    return this.request(`/prestations/lignes/${ligneId}/fournir`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPrescriptionsByAssure(assureId: number) {
    const r = await this.request<{ prescriptions: any[] }>(`/prescriptions?assureId=${assureId}`);
    return (r as any)?.prescriptions ?? (Array.isArray(r) ? r : []);
  }

  // ─── Familles ─────────────────────────────────────────────────────────────

  async getFamilles() {
    return this.request<any[]>('/familles');
  }

  async getFamilleById(id: number) {
    return this.request<any>(`/familles/${id}`);
  }

  async createFamille(data: any) {
    return this.request<any>('/familles', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateFamille(id: number, data: any) {
    return this.request<any>(`/familles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteFamille(id: number) {
    return this.request(`/familles/${id}`, { method: 'DELETE' });
  }

  // ─── Groupes ──────────────────────────────────────────────────────────────

  async getGroupes() {
    return this.request<any[]>('/groupes');
  }

  async getGroupeById(id: number) {
    return this.request<any>(`/groupes/${id}`);
  }

  async createGroupe(data: any) {
    return this.request<any>('/groupes', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateGroupe(id: number, data: any) {
    return this.request<any>(`/groupes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async deleteGroupe(id: number) {
    return this.request(`/groupes/${id}`, { method: 'DELETE' });
  }

  // ─── Paiements de primes ──────────────────────────────────────────────────

  async getPaiementsPrimes() {
    return this.request<any[]>('/paiements-primes');
  }

  async getPaiementsPrimesByPolice(policeId: string) {
    return this.request<any[]>(`/paiements-primes/police/${policeId}`);
  }

  async getPaiementsEnRetard() {
    return this.request<any[]>('/paiements-primes/en-retard');
  }

  async creerPaiementPrime(data: any) {
    return this.request<any>('/paiements-primes', { method: 'POST', body: JSON.stringify(data) });
  }

  async payerPaiementPrime(id: string, data: { moyenPaiement: string; referenceTransaction?: string; notes?: string }) {
    return this.request<any>(`/paiements-primes/${id}/payer`, { method: 'PUT', body: JSON.stringify(data) });
  }

  async marquerEnRetardPaiement(id: string) {
    return this.request<any>(`/paiements-primes/${id}/retard`, { method: 'PUT' });
  }

  async supprimerPaiementPrime(id: string) {
    return this.request(`/paiements-primes/${id}`, { method: 'DELETE' });
  }

  // ─── Avenants de contrat ──────────────────────────────────────────────────

  async getAvenantsContrat() {
    return this.request<any[]>('/avenants-contrat');
  }

  async creerAvenantContrat(data: any) {
    return this.request<any>('/avenants-contrat', { method: 'POST', body: JSON.stringify(data) });
  }

  async approuverAvenantContrat(id: string, commentaire?: string) {
    return this.request<any>(`/avenants-contrat/${id}/approuver`, {
      method: 'PUT',
      body: JSON.stringify({ commentaire: commentaire ?? '' }),
    });
  }

  async refuserAvenantContrat(id: string, commentaire?: string) {
    return this.request<any>(`/avenants-contrat/${id}/refuser`, {
      method: 'PUT',
      body: JSON.stringify({ commentaire: commentaire ?? '' }),
    });
  }

  async supprimerAvenantContrat(id: string) {
    return this.request(`/avenants-contrat/${id}`, { method: 'DELETE' });
  }

  // ─── Demandes de contrat ──────────────────────────────────────────────────

  async getDemandesContrat() {
    return this.request<any[]>('/demandes-contrat');
  }

  async creerDemandeContrat(data: any) {
    return this.request<any>('/demandes-contrat', { method: 'POST', body: JSON.stringify(data) });
  }

  async approuverDemandeContrat(id: string, commentaire?: string) {
    return this.request<any>(`/demandes-contrat/${id}/approuver`, {
      method: 'PUT',
      body: JSON.stringify({ commentaire: commentaire ?? '' }),
    });
  }

  async refuserDemandeContrat(id: string, commentaire?: string) {
    return this.request<any>(`/demandes-contrat/${id}/refuser`, {
      method: 'PUT',
      body: JSON.stringify({ commentaire: commentaire ?? '' }),
    });
  }

  async supprimerDemandeContrat(id: string) {
    return this.request(`/demandes-contrat/${id}`, { method: 'DELETE' });
  }

  // ─── Documents médicaux ──────────────────────────────────────────────────

  async clientUploadDocument(file: File, params?: { consultationId?: number; description?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (params?.consultationId) formData.append('consultationId', String(params.consultationId));
    if (params?.description)    formData.append('description',    params.description);

    const url = `${this.baseURL}/documents/client-upload`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur upload' }));
      throw new Error(err.message || 'Erreur upload');
    }
    const json = await response.json();
    return json.success !== undefined ? json.data : json;
  }

  async uploadDocument(file: File, params: { assureId?: number; consultationId?: number; description?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (params.assureId)      formData.append('assureId',      String(params.assureId));
    if (params.consultationId) formData.append('consultationId', String(params.consultationId));
    if (params.description)   formData.append('description',   params.description);

    const url = `${this.baseURL}/documents/upload`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur upload' }));
      throw new Error(err.message || 'Erreur upload');
    }
    const json = await response.json();
    return json.success !== undefined ? json.data : json;
  }

  async getDocumentsByConsultation(consultationId: number) {
    return this.request<any[]>(`/documents/consultation/${consultationId}`);
  }

  async getDocumentsByAssure(assureId: number) {
    return this.request<any[]>(`/documents/assure/${assureId}`);
  }

  getDocumentDownloadUrl(documentId: number) {
    return `${this.baseURL}/documents/${documentId}/download`;
  }

  async deleteDocument(id: number) {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  // ─── Photos de profil ─────────────────────────────────────────────────────

  async uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const url = `${this.baseURL}/photos/upload`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erreur upload photo' }));
      throw new Error(err.message || 'Erreur upload photo');
    }
    const json = await response.json();
    const data = json.success !== undefined ? json.data : json;
    return data.url as string;
  }

  getPhotoUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    const base = this.baseURL.replace(/\/api$/, '');
    return path.startsWith('/api/') ? `${base}${path}` : path;
  }

  // ─── Divers ───────────────────────────────────────────────────────────────

  async getRemboursements() {
    return this.request<{ remboursements: any[] }>('/remboursements');
  }

  async getCartes() {
    return this.request<{ cartes: any[] }>('/cartes');
  }
}

export const apiClient = new ApiClient();
