// Types métier — Propositions d'assurance (Cas 1 & 2)

export type StatutProposition = 'brouillon' | 'envoyee' | 'acceptee' | 'refusee' | 'convertie';
export type TypeProposition   = 'FAMILLE'   | 'GROUPE';

// ─── Données spécifiques Famille ─────────────────────────────────────────────

export interface PropositionFamilleData {
  souscripteurNom:     string;
  souscripteurEmail:   string;
  souscripteurTel:     string;
  souscripteurAdresse: string;
  nbAdultes:           number;
  nbEnfants:           number;
  nbPersonnesAgees:    number;
  typeGarantie:        'Standard' | 'Confort' | 'Premium';
  dureeAns:            number;
  dateDebut:           string;
  primeEstimee:        number;   // calculée côté front, indicative
  tauxRemboursement:   number;
  observations:        string;
}

// ─── Données spécifiques Groupe ──────────────────────────────────────────────

export interface PropositionGroupeData {
  entreprise:          string;
  secteur:             string;
  contactNom:          string;
  contactEmail:        string;
  contactTel:          string;
  nbAdultes:           number;
  nbEnfants:           number;
  nbPersonnesAgees:    number;
  dureeAns:            number;
  dateDebut:           string;
  primeEstimee:        number;
  tauxRemboursement:   number;
  // Tarifs personnalisés (null = tarifs globaux)
  tarifsPersoAdulte:   number | null;
  tarifsPersoEnfant:   number | null;
  tarifsPersoAdulteAge: number | null;
  observations:        string;
}

// ─── Proposition (document commercial) ───────────────────────────────────────

export interface Proposition {
  id:           string;
  type:         TypeProposition;
  statut:       StatutProposition;
  reference:    string;          // ex. "PROP-2026-0001"
  createdAt:    string;          // ISO date
  updatedAt:    string;          // ISO date
  envoyeeAt:    string | null;
  accepteeAt:   string | null;
  policeId:     string | null;   // rempli après Cas 2 — conversion en police
  famille:      PropositionFamilleData | null;
  groupe:       PropositionGroupeData  | null;
}
