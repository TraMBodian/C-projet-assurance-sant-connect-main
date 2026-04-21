// API Client - connecté au backend Spring Boot sur http://localhost:3001/api
export class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.timeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const json = await response.json();
      // Le backend Spring Boot retourne { success, data, message }
      // On extrait data si présent, sinon on retourne le JSON brut
      return (json && json.success !== undefined ? json.data : json) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') throw new Error('Délai de connexion dépassé');
        if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          throw new Error('Failed to fetch');
        }
        throw error;
      }
      throw new Error('Erreur inconnue');
    }
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: { email: string; password: string; fullName: string; role: string; organization?: string; telephone?: string; adresse?: string }) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' }).catch(() => ({}));
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me');
  }

  // Users
  async getUsers() {
    return this.request<{ users: any[] }>('/users');
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

  // Assurés
  async getAssures() {
    return this.request<{ assures: any[] }>('/assures');
  }

  async getAssureById(id: string) {
    return this.request<any>(`/assures/${id}`);
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

  // Polices
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

  // Sinistres
  async getSinistres() {
    return this.request<{ sinistres: any[] }>('/sinistres');
  }

  async getSinistreById(id: string) {
    return this.request<any>(`/sinistres/${id}`);
  }

  async createSinistre(data: any) {
    return this.request('/sinistres', { method: 'POST', body: JSON.stringify(data) });
  }

  // Prestataires
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

  // Consultations
  async getConsultations() {
    return this.request<{ consultations: any[] }>('/consultations');
  }

  async createConsultation(data: any) {
    return this.request('/consultations', { method: 'POST', body: JSON.stringify(data) });
  }

  // Prescriptions
  async getPrescriptions() {
    return this.request<{ prescriptions: any[] }>('/prescriptions');
  }

  async createPrescription(data: any) {
    return this.request('/prescriptions', { method: 'POST', body: JSON.stringify(data) });
  }

  // Familles
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

  // Remboursements
  async getRemboursements() {
    return this.request<{ remboursements: any[] }>('/remboursements');
  }

  // Cartes (assurés avec carte)
  async getCartes() {
    return this.request<{ cartes: any[] }>('/cartes');
  }

  // Groupes
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
}

export const apiClient = new ApiClient();
