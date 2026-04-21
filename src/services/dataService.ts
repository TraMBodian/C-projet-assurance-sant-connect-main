// Data service - connecté au backend Spring Boot, avec fallback localStorage
import { apiClient } from './apiClient';
import {
  MOCK_ASSURES, MOCK_POLICES, MOCK_SINISTRES, MOCK_PRESTATAIRES,
  MOCK_CONSULTATIONS, MOCK_PRESCRIPTIONS, MOCK_REMBOURSEMENTS,
  MOCK_USERS, MOCK_CARTES,
} from './mockData';

// ─── Helpers réseau ───────────────────────────────────────────────────────────

function isNetworkError(err: any): boolean {
  const msg: string = err?.message ?? "";
  return msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("network");
}

async function withFallback<T>(apiCall: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await apiCall();
  } catch {
    return fallback;
  }
}

// ─── Store localStorage (mode hors-ligne) ────────────────────────────────────

function lsGet(key: string): any[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function lsSet(key: string, data: any[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const LS_GROUPES  = "cnart_groupes_local";
const LS_FAMILLES = "cnart_familles_local";

const localGroupes = {
  getAll:    ()                  => lsGet(LS_GROUPES),
  getById:   (id: number)        => lsGet(LS_GROUPES).find((g: any) => g.id === id) ?? null,
  create:    (data: any)         => {
    const item = { ...data, id: Date.now(), statut: data.statut ?? "Actif", _local: true };
    lsSet(LS_GROUPES, [item, ...lsGet(LS_GROUPES)]);
    return item;
  },
  update:    (id: number, data: any) => {
    const list = lsGet(LS_GROUPES).map((g: any) => g.id === id ? { ...g, ...data, id } : g);
    lsSet(LS_GROUPES, list);
    return { ...data, id };
  },
  delete:    (id: number)        => {
    lsSet(LS_GROUPES, lsGet(LS_GROUPES).filter((g: any) => g.id !== id));
  },
};

const localFamilles = {
  getAll:    ()                  => lsGet(LS_FAMILLES),
  getById:   (id: number)        => lsGet(LS_FAMILLES).find((f: any) => f.id === id) ?? null,
  create:    (data: any)         => {
    const item = { ...data, id: Date.now(), statut: data.statut ?? "Actif", _local: true };
    lsSet(LS_FAMILLES, [item, ...lsGet(LS_FAMILLES)]);
    return item;
  },
  update:    (id: number, data: any) => {
    const list = lsGet(LS_FAMILLES).map((f: any) => f.id === id ? { ...f, ...data, id } : f);
    lsSet(LS_FAMILLES, list);
    return { ...data, id };
  },
  delete:    (id: number)        => {
    lsSet(LS_FAMILLES, lsGet(LS_FAMILLES).filter((f: any) => f.id !== id));
  },
};

// ─── DataService ──────────────────────────────────────────────────────────────

export class DataService {

  // Assurés
  static async getAssures() {
    return withFallback(async () => {
      const r = await apiClient.getAssures();
      return r.assures;
    }, MOCK_ASSURES);
  }

  static async getAssureById(id: string) {
    return withFallback(
      () => apiClient.getAssureById(id),
      MOCK_ASSURES.find(a => String(a.id) === id) ?? null
    );
  }

  static async createAssure(data: any) {
    return apiClient.createAssure(data);
  }

  static async updateAssure(id: string, data: any) {
    return apiClient.updateAssure(id, data);
  }

  static async deleteAssure(id: string) {
    return apiClient.deleteAssure(id);
  }

  // Polices
  static async getPolices() {
    return withFallback(async () => {
      const r = await apiClient.getPolices();
      return r.polices;
    }, MOCK_POLICES);
  }

  static async createPolice(data: any) {
    return apiClient.createPolice(data);
  }

  static async updatePolice(id: string, data: any) {
    return apiClient.updatePolice(id, data);
  }

  static async deletePolice(id: string) {
    return apiClient.deletePolice(id);
  }

  // Sinistres
  static async getSinistres() {
    return withFallback(async () => {
      const r = await apiClient.getSinistres();
      return r.sinistres;
    }, MOCK_SINISTRES);
  }

  static async getSinistreById(id: string) {
    return withFallback(
      () => apiClient.getSinistreById(id),
      MOCK_SINISTRES.find(s => String(s.id) === id) ?? null
    );
  }

  static async createSinistre(data: any) {
    return apiClient.createSinistre(data);
  }

  // Prestataires
  static async getPrestataires() {
    return withFallback(async () => {
      const r = await apiClient.getPrestataires();
      return r.prestataires;
    }, MOCK_PRESTATAIRES);
  }

  static async createPrestataire(data: any) {
    return apiClient.createPrestataire(data);
  }

  static async updatePrestataire(id: string | number, data: any) {
    return apiClient.updatePrestataire(id, data);
  }

  static async deletePrestataire(id: string | number) {
    return apiClient.deletePrestataire(id);
  }

  // Consultations
  static async getConsultations() {
    return withFallback(async () => {
      const r = await apiClient.getConsultations();
      return r.consultations;
    }, MOCK_CONSULTATIONS);
  }

  static async createConsultation(data: any) {
    return apiClient.createConsultation(data);
  }

  // Prescriptions
  static async getPrescriptions() {
    return withFallback(async () => {
      const r = await apiClient.getPrescriptions();
      return r.prescriptions;
    }, MOCK_PRESCRIPTIONS);
  }

  static async createPrescription(data: any) {
    return apiClient.createPrescription(data);
  }

  // Remboursements
  static async getRemboursements() {
    return withFallback(async () => {
      const r = await apiClient.getRemboursements();
      return r.remboursements;
    }, MOCK_REMBOURSEMENTS);
  }

  // Cartes
  static async getCartes() {
    return withFallback(async () => {
      const r = await apiClient.getCartes();
      return r.cartes;
    }, MOCK_CARTES);
  }

  // Users
  static async getUsers() {
    return withFallback(async () => {
      const r = await apiClient.getUsers();
      return r.users;
    }, MOCK_USERS);
  }

  static async updateUser(id: string, data: any) {
    return apiClient.updateUser(id, data);
  }

  static async deleteUser(id: string) {
    return apiClient.deleteUser(id);
  }

  // ─── Familles ───────────────────────────────────────────────────────────────

  static async getFamilles() {
    try {
      const res = await apiClient.getFamilles();
      const remote = Array.isArray(res) ? res : (res as any)?.data ?? [];
      // Fusionner avec les entrées locales non encore synchronisées
      const local = localFamilles.getAll().filter((f: any) => f._local);
      return [...local, ...remote];
    } catch {
      return localFamilles.getAll();
    }
  }

  static async createFamille(data: any) {
    try {
      const res = await apiClient.createFamille(data);
      return (res as any)?.data ?? res;
    } catch (err: any) {
      if (isNetworkError(err)) return localFamilles.create(data);
      throw err;
    }
  }

  static async updateFamille(id: number, data: any) {
    try {
      const res = await apiClient.updateFamille(id, data);
      return (res as any)?.data ?? res;
    } catch (err: any) {
      if (isNetworkError(err)) return localFamilles.update(id, data);
      throw err;
    }
  }

  static async deleteFamille(id: number) {
    try {
      return await apiClient.deleteFamille(id);
    } catch (err: any) {
      if (isNetworkError(err)) { localFamilles.delete(id); return null; }
      throw err;
    }
  }

  static async getFamilleById(id: number) {
    try {
      const res = await apiClient.getFamilleById(id);
      return (res as any)?.data ?? res;
    } catch {
      return localFamilles.getById(id);
    }
  }

  // ─── Groupes ────────────────────────────────────────────────────────────────

  static async getGroupes() {
    try {
      const res = await apiClient.getGroupes();
      const remote = Array.isArray(res) ? res : (res as any)?.data ?? [];
      // Fusionner avec les entrées locales non encore synchronisées
      const local = localGroupes.getAll().filter((g: any) => g._local);
      return [...local, ...remote];
    } catch {
      return localGroupes.getAll();
    }
  }

  static async createGroupe(data: any) {
    try {
      const res = await apiClient.createGroupe(data);
      return (res as any)?.data ?? res;
    } catch (err: any) {
      if (isNetworkError(err)) return localGroupes.create(data);
      throw err;
    }
  }

  static async updateGroupe(id: number, data: any) {
    try {
      const res = await apiClient.updateGroupe(id, data);
      return (res as any)?.data ?? res;
    } catch (err: any) {
      if (isNetworkError(err)) return localGroupes.update(id, data);
      throw err;
    }
  }

  static async deleteGroupe(id: number) {
    try {
      return await apiClient.deleteGroupe(id);
    } catch (err: any) {
      if (isNetworkError(err)) { localGroupes.delete(id); return null; }
      throw err;
    }
  }

  static async getGroupeById(id: number) {
    try {
      const res = await apiClient.getGroupeById(id);
      return (res as any)?.data ?? res;
    } catch {
      return localGroupes.getById(id);
    }
  }
}
