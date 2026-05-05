// Data service - connecté au backend Spring Boot
import { apiClient } from './apiClient';
import type { Proposition, StatutProposition } from '@/pages/admin/nouvelle-proposition/types';

// ─── Helpers réseau ───────────────────────────────────────────────────────────

function isNetworkError(err: any): boolean {
  const msg: string = err?.message ?? "";
  return msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("network");
}

// ─── Store localStorage (mode hors-ligne) ────────────────────────────────────

function lsGet(key: string): any[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function lsSet(key: string, data: any[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const LS_GROUPES       = "cnart_groupes_local";
const LS_FAMILLES      = "cnart_familles_local";
const LS_PROPOSITIONS  = "cnart_propositions_local";

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

// ─── Référence auto-incrémentée ──────────────────────────────────────────────

function nextPropRef(): string {
  const year  = new Date().getFullYear();
  const items = lsGet(LS_PROPOSITIONS) as Proposition[];
  const count = items.filter(p => p.reference.startsWith(`PROP-${year}-`)).length + 1;
  return `PROP-${year}-${String(count).padStart(4, "0")}`;
}

const localFamilles = {
  getAll:    ()                  => lsGet(LS_FAMILLES),
  getById:   (id: number)        => lsGet(LS_FAMILLES).find((f: any) => f.id === id) ?? null,
  create:    (data: any)         => {
    const item = { ...data, id: Date.now(), statut: data.statut ?? "En attente", _local: true };
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
    const r = await apiClient.getAssures();
    return r.assures;
  }

  static async getAssureById(id: string) {
    return apiClient.getAssureById(id);
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
    const r = await apiClient.getPolices();
    return r.polices;
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
    const r = await apiClient.getSinistres();
    return r.sinistres;
  }

  static async getSinistreById(id: string) {
    return apiClient.getSinistreById(id);
  }

  static async createSinistre(data: any) {
    return apiClient.createSinistre(data);
  }

  // Prestataires
  static async getPrestataires() {
    const r = await apiClient.getPrestataires();
    return r.prestataires;
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
    const r = await apiClient.getConsultations();
    return r.consultations;
  }

  static async createConsultation(data: any) {
    return apiClient.createConsultation(data);
  }

  // Prescriptions
  static async getPrescriptions() {
    const r = await apiClient.getPrescriptions();
    return r.prescriptions;
  }

  static async createPrescription(data: any) {
    return apiClient.createPrescription(data);
  }

  // Remboursements
  static async getRemboursements() {
    const r = await apiClient.getRemboursements();
    return r.remboursements;
  }

  // Cartes
  static async getCartes() {
    const r = await apiClient.getCartes();
    return r.cartes;
  }

  // Users
  static async getUsers() {
    const r = await apiClient.getUsers();
    return r.users;
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
    // Règle métier : toute nouvelle famille est créée "En attente" de validation admin.
    // On normalise avant d'envoyer pour ne pas dépendre du défaut backend.
    const payload = { ...data, statut: "En attente" };
    try {
      const res = await apiClient.createFamille(payload);
      const created = (res as any)?.data ?? res;
      return { ...created, statut: "En attente" };
    } catch (err: any) {
      if (isNetworkError(err)) return localFamilles.create(payload);
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

  // ─── Propositions (localStorage uniquement — pas encore d'API backend) ───────

  static getPropositions(): Proposition[] {
    return lsGet(LS_PROPOSITIONS) as Proposition[];
  }

  static getPropositionById(id: string): Proposition | null {
    return (lsGet(LS_PROPOSITIONS) as Proposition[]).find(p => p.id === id) ?? null;
  }

  static createProposition(data: Omit<Proposition, 'id' | 'reference' | 'createdAt' | 'updatedAt'>): Proposition {
    const now  = new Date().toISOString();
    const prop: Proposition = {
      ...data,
      id:        `prop_${Date.now()}`,
      reference: nextPropRef(),
      createdAt: now,
      updatedAt: now,
    };
    lsSet(LS_PROPOSITIONS, [prop, ...lsGet(LS_PROPOSITIONS)]);
    return prop;
  }

  static updateProposition(id: string, patch: Partial<Proposition>): Proposition {
    const list = lsGet(LS_PROPOSITIONS) as Proposition[];
    const idx  = list.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Proposition ${id} introuvable`);
    const updated = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    lsSet(LS_PROPOSITIONS, list);
    return updated;
  }

  static updatePropositionStatut(id: string, statut: StatutProposition): Proposition {
    const now  = new Date().toISOString();
    const patch: Partial<Proposition> = { statut };
    if (statut === 'envoyee')  patch.envoyeeAt  = now;
    if (statut === 'acceptee') patch.accepteeAt = now;
    return DataService.updateProposition(id, patch);
  }

  static deleteProposition(id: string): void {
    lsSet(LS_PROPOSITIONS, (lsGet(LS_PROPOSITIONS) as Proposition[]).filter(p => p.id !== id));
  }
}
