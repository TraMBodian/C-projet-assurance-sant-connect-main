export interface Assure {
  id: string;
  numero: string;
  nom: string;
  prenom: string;
  dateNaissance?: string;
  sexe?: string;
  telephone?: string;
  adresse?: string;
  email?: string;
  pieceIdentite?: string;
  profession?: string;
  dateSouscription?: string;
  dateDebut?: string;
  dateFin?: string;
  dateAdhesion?: string;
  lien?: string;
  salaire?: string;
  garantie?: string;
  secteur?: string;
  prime?: string;
  statut: string;
  type: string;
}

export interface Beneficiaire {
  id: string;
  numero: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  lien: "Epouse" | "Enfant";
  statut: string;
  assurePrincipalId: string;
}

export interface Police {
  id: string;
  numero: string;
  assurePrincipal: string;
  type: "Famille" | "Groupe";
  dateDebut: string;
  dateFin: string;
  statut: string;
  montantCotisation: string;
  nbBeneficiaires: number;
}

export interface Prestataire {
  id: string;
  numero: string;
  nom: string;
  type: string;
  telephone: string;
  email: string;
  adresse: string;
  statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
}

export interface Sinistre {
  id: string;
  numero: string;
  assure: string;
  type: string;
  date: string;
  montantReclame: string;
  montantValide: string;
  statut: "En attente" | "Validé" | "Rejeté" | "Payé";
}

export interface Consultation {
  id: string;
  numero: string;
  assure: string;
  prestataire: string;
  date: string;
  diagnostic: string;
  observations: string;
}

export interface Prescription {
  id: string;
  numero: string;
  medecin: string;
  assure: string;
  date: string;
  medicaments: string;
  posologie: string;
  duree: string;
}

export interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: string;
}
