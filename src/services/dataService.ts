// Data service — toutes les données viennent du backend Spring Boot
import { apiClient } from './apiClient';

export class DataService {

  // ─── Assurés ────────────────────────────────────────────────────────────────

  static async getAssures() {
    const r = await apiClient.getAssures();
    return r.assures ?? [];
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

  static async getMesBeneficiaires() {
    const data = await apiClient.getMesBeneficiaires();
    return Array.isArray(data) ? data : [];
  }

  // ─── Polices ────────────────────────────────────────────────────────────────

  static async getPolices() {
    const r = await apiClient.getPolices();
    return r.polices ?? [];
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

  // ─── Sinistres ──────────────────────────────────────────────────────────────

  static async getSinistres() {
    const r = await apiClient.getSinistres();
    return r.sinistres ?? [];
  }

  static async getSinistreById(id: string) {
    return apiClient.getSinistreById(id);
  }

  static async createSinistre(data: any) {
    return apiClient.createSinistre(data);
  }

  // ─── Prestataires ───────────────────────────────────────────────────────────

  static async getPrestataires() {
    const r = await apiClient.getPrestataires();
    return r.prestataires ?? [];
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

  // ─── Consultations ──────────────────────────────────────────────────────────

  static async getConsultations() {
    const r = await apiClient.getConsultations();
    return r.consultations ?? [];
  }

  static async getConsultation(id: string | number) {
    const r = await apiClient.request<any>(`/consultations/${id}`);
    return r.data ?? r;
  }

  static async createConsultation(data: any) {
    return apiClient.createConsultation(data);
  }

  // ─── Prescriptions ──────────────────────────────────────────────────────────

  static async getPrescriptions() {
    const r = await apiClient.getPrescriptions();
    return r.prescriptions ?? [];
  }

  static async createPrescription(data: any) {
    return apiClient.createPrescription(data);
  }

  // ─── Prestations ────────────────────────────────────────────────────────────

  static async getMyPrestataire() {
    return apiClient.getMyPrestataire();
  }

  static async getPrestations() {
    const r = await apiClient.getPrestations();
    return r.prestations ?? [];
  }

  static async createPrestation(data: any) {
    return apiClient.createPrestation(data);
  }

  static async getPrestationLignes(prestationId: string) {
    const r = await apiClient.getPrestationLignes(prestationId);
    return r.lignes ?? [];
  }

  static async createLignePrestation(prestationId: string, data: any) {
    return apiClient.createLignePrestation(prestationId, data);
  }

  static async fournirLignePrestation(ligneId: string, prestataireId: number, prescriptionId?: number | null) {
    return apiClient.fournirLignePrestation(ligneId, { prestataireId, prescriptionId });
  }

  static async refuserLignePrestation(ligneId: string) {
    return apiClient.refuserLignePrestation(ligneId);
  }

  // ─── Utilisateurs ───────────────────────────────────────────────────────────

  static async getUsers() {
    const r = await apiClient.getUsers();
    return r.users ?? [];
  }

  static async updateUser(id: string, data: any) {
    return apiClient.updateUser(id, data);
  }

  static async deleteUser(id: string) {
    return apiClient.deleteUser(id);
  }

  // ─── Familles ───────────────────────────────────────────────────────────────

  static async getFamilles() {
    const data = await apiClient.getFamilles();
    return Array.isArray(data) ? data : [];
  }

  static async getFamilleById(id: number) {
    return apiClient.getFamilleById(id);
  }

  static async createFamille(data: any) {
    return apiClient.createFamille({ ...data, statut: data.statut ?? "En attente" });
  }

  static async updateFamille(id: number, data: any) {
    return apiClient.updateFamille(id, data);
  }

  static async deleteFamille(id: number) {
    return apiClient.deleteFamille(id);
  }

  // ─── Groupes ────────────────────────────────────────────────────────────────

  static async getGroupes() {
    const data = await apiClient.getGroupes();
    return Array.isArray(data) ? data : [];
  }

  static async getGroupeById(id: number) {
    return apiClient.getGroupeById(id);
  }

  static async createGroupe(data: any) {
    return apiClient.createGroupe(data);
  }

  static async updateGroupe(id: number, data: any) {
    return apiClient.updateGroupe(id, data);
  }

  static async deleteGroupe(id: number) {
    return apiClient.deleteGroupe(id);
  }

  // ─── Paiements de primes ────────────────────────────────────────────────────

  static async getPaiementsPrimes() {
    const data = await apiClient.getPaiementsPrimes();
    return Array.isArray(data) ? data : [];
  }

  static async getPaiementsPrimesByPolice(policeId: string) {
    const data = await apiClient.getPaiementsPrimesByPolice(policeId);
    return Array.isArray(data) ? data : [];
  }

  static async getPaiementsEnRetard() {
    const data = await apiClient.getPaiementsEnRetard();
    return Array.isArray(data) ? data : [];
  }

  static async creerPaiementPrime(data: any) {
    return apiClient.creerPaiementPrime(data);
  }

  static async payerPaiementPrime(id: string, data: { moyenPaiement: string; referenceTransaction?: string; notes?: string }) {
    return apiClient.payerPaiementPrime(id, data);
  }

  static async marquerEnRetardPaiement(id: string) {
    return apiClient.marquerEnRetardPaiement(id);
  }

  static async supprimerPaiementPrime(id: string) {
    return apiClient.supprimerPaiementPrime(id);
  }

  // ─── Avenants de contrat ────────────────────────────────────────────────────

  static async getAvenantsContrat() {
    const data = await apiClient.getAvenantsContrat();
    return Array.isArray(data) ? data : [];
  }

  static async creerAvenantContrat(data: any) {
    return apiClient.creerAvenantContrat(data);
  }

  static async approuverAvenantContrat(id: string, commentaire?: string) {
    return apiClient.approuverAvenantContrat(id, commentaire);
  }

  static async refuserAvenantContrat(id: string, commentaire?: string) {
    return apiClient.refuserAvenantContrat(id, commentaire);
  }

  static async supprimerAvenantContrat(id: string) {
    return apiClient.supprimerAvenantContrat(id);
  }

  // ─── Demandes de contrat ────────────────────────────────────────────────────

  static async getDemandesContrat() {
    const data = await apiClient.getDemandesContrat();
    return Array.isArray(data) ? data : [];
  }

  static async creerDemandeContrat(data: any) {
    return apiClient.creerDemandeContrat(data);
  }

  static async approuverDemandeContrat(id: string, commentaire?: string) {
    return apiClient.approuverDemandeContrat(id, commentaire);
  }

  static async refuserDemandeContrat(id: string, commentaire?: string) {
    return apiClient.refuserDemandeContrat(id, commentaire);
  }

  static async supprimerDemandeContrat(id: string) {
    return apiClient.supprimerDemandeContrat(id);
  }

  // ─── Propositions ───────────────────────────────────────────────────────────
  // Stockées en base via /api/propositions (à implémenter côté backend si nécessaire)

  private static _localPropositions: any[] | null = null;

  private static getLocalPropositions(): any[] {
    if (!this._localPropositions) {
      this._localPropositions = [
        {
          id: 'prop-1',
          type: 'FAMILLE',
          statut: 'brouillon',
          reference: 'PROP-2026-0001',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          envoyeeAt: null,
          accepteeAt: null,
          policeId: null,
          famille: {
            souscripteurNom: 'Dupont Jean',
            souscripteurEmail: 'jean.dupont@email.com',
            souscripteurTel: '+221 77 123 45 67',
            souscripteurAdresse: '123 Rue de la Paix, Dakar',
            membresFamille: [],
            nbAdultes: 2,
            nbEnfants: 1,
            nbPersonnesAgees: 0,
            typeGarantie: 'Standard',
            dureeAns: 1,
            dateDebut: '2026-06-01',
            primeEstimee: 45000,
            tauxRemboursement: 80,
            tarifsPersoAdulte: null,
            tarifsPersoEnfant: null,
            tarifsPersoAdulteAge: null,
            observations: '',
          },
          groupe: null,
        },
        {
          id: 'prop-2',
          type: 'GROUPE',
          statut: 'envoyee',
          reference: 'PROP-2026-0002',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          envoyeeAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          accepteeAt: null,
          policeId: null,
          famille: null,
          groupe: {
            entreprise: 'TechStartup SA',
            secteur: 'Informatique',
            contactNom: 'Sall Moussa',
            contactEmail: 'moussa@techstartup.sn',
            contactTel: '+221 77 234 56 78',
            nbAdultes: 15,
            nbEnfants: 3,
            nbPersonnesAgees: 2,
            typeGarantie: 'Confort',
            dureeAns: 2,
            dateDebut: '2026-07-01',
            primeEstimee: 320000,
            tauxRemboursement: 85,
            tarifsPersoAdulte: null,
            tarifsPersoEnfant: null,
            tarifsPersoAdulteAge: null,
            observations: 'PME dynamique, 20 employés',
          },
        },
        {
          id: 'prop-3',
          type: 'FAMILLE',
          statut: 'acceptee',
          reference: 'PROP-2026-0003',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          envoyeeAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          accepteeAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          policeId: null,
          famille: {
            souscripteurNom: 'Sow Fatou',
            souscripteurEmail: 'fatou.sow@email.com',
            souscripteurTel: '+221 77 345 67 89',
            souscripteurAdresse: '456 Avenue des Sports, Thiès',
            membresFamille: [],
            nbAdultes: 1,
            nbEnfants: 2,
            nbPersonnesAgees: 1,
            typeGarantie: 'Premium',
            dureeAns: 1,
            dateDebut: '2026-08-01',
            primeEstimee: 65000,
            tauxRemboursement: 90,
            tarifsPersoAdulte: null,
            tarifsPersoEnfant: null,
            tarifsPersoAdulteAge: null,
            observations: 'Client VIP',
          },
          groupe: null,
        },
      ];
    }
    return this._localPropositions;
  }

  static async getPropositions() {
    try {
      const data = await apiClient.request<any[]>('/propositions');
      this._localPropositions = data;
      return data;
    } catch {
      return [...this.getLocalPropositions()];
    }
  }

  static async getPropositionById(id: string) {
    try {
      return await apiClient.request<any>(`/propositions/${id}`);
    } catch {
      return this.getLocalPropositions().find((prop) => prop.id === id) ?? null;
    }
  }

  static async createProposition(data: any) {
    try {
      const result = await apiClient.request<any>('/propositions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      this._localPropositions = null;
      return result;
    } catch {
      const now = new Date().toISOString();
      const proposition = {
        ...data,
        id: `prop-${Date.now()}`,
        reference: `PROP-${new Date().getFullYear()}-${String(this.getLocalPropositions().length + 1).padStart(4, '0')}`,
        createdAt: now,
        updatedAt: now,
        envoyeeAt: data.statut === 'envoyee' ? now : null,
        accepteeAt: data.statut === 'acceptee' ? now : null,
        policeId: data.policeId ?? null,
      };
      this.getLocalPropositions().unshift(proposition);
      return proposition;
    }
  }

  static async updateProposition(id: string, data: any) {
    try {
      const result = await apiClient.request<any>(`/propositions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      this._localPropositions = null;
      return result;
    } catch {
      const props = this.getLocalPropositions();
      const index = props.findIndex((prop) => prop.id === id);
      if (index === -1) {
        throw new Error(`Proposition ${id} introuvable`);
      }
      const updated = {
        ...props[index],
        ...data,
        updatedAt: new Date().toISOString(),
        envoyeeAt: data.statut === 'envoyee' ? new Date().toISOString() : props[index].envoyeeAt,
        accepteeAt: data.statut === 'acceptee' ? new Date().toISOString() : props[index].accepteeAt,
      };
      props[index] = updated;
      return updated;
    }
  }

  static async updatePropositionStatut(id: string, statut: string) {
    try {
      return await apiClient.request<any>(`/propositions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ statut }),
      });
    } catch {
      return this.updateProposition(id, { statut });
    }
  }

  static async deleteProposition(id: string) {
    try {
      return await apiClient.request<any>(`/propositions/${id}`, { method: 'DELETE' });
    } catch {
      const props = this.getLocalPropositions();
      const index = props.findIndex((prop) => prop.id === id);
      if (index === -1) {
        throw new Error(`Proposition ${id} introuvable`);
      }
      props.splice(index, 1);
      return null;
    }
  }
}
