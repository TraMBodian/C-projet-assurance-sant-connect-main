import { TARIF_DEFAULTS, type TarifSettings } from "@/services/tarifService";

// ─── Constantes CNART ─────────────────────────────────────────────────────────

export const PRIME_ENFANT     = 237_500;
export const PRIME_ADULTE     = 475_000;
export const PRIME_ADULTE_AGE = 712_500;
export const TAUX_TAXE        = 0.10;

export type TypeAssure = "enfant" | "adulte" | "adulte_age";

export const TYPE_LABELS: Record<TypeAssure, string> = {
  enfant:     "Enfant (< 21 ans)",
  adulte:     "Adulte (21 – 59 ans)",
  adulte_age: "Personne âgée (60 ans et +)",
};

export const TYPE_PRICES: Record<TypeAssure, number> = {
  enfant:     PRIME_ENFANT,
  adulte:     PRIME_ADULTE,
  adulte_age: PRIME_ADULTE_AGE,
};

export const TYPE_COLORS: Record<TypeAssure, string> = {
  enfant:     "bg-blue-50 border-blue-200 text-blue-600",
  adulte:     "bg-blue-100 border-blue-300 text-blue-700",
  adulte_age: "bg-blue-50 border-blue-200 text-blue-800",
};

export interface Beneficiaire {
  nom:           string;
  lien:          string;
  type:          TypeAssure;
  dateNaissance: string;
  lieuNaissance: string;
  email:         string;
  telephone:     string;
}

export function typeFromDate(dateNaissance: string): TypeAssure {
  if (!dateNaissance) return "adulte";
  const age = Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 86_400_000));
  if (age < 21)  return "enfant";
  if (age >= 60) return "adulte_age";
  return "adulte";
}

export function newBeneficiaire(): Beneficiaire {
  return { nom: "", lien: "", type: "adulte", dateNaissance: "", lieuNaissance: "", email: "", telephone: "" };
}

// ─── Tableau des garanties ────────────────────────────────────────────────────

export function getGarantiesCNART(tarifs?: TarifSettings, tauxOverride?: number) {
  const t = tarifs ?? TARIF_DEFAULTS;
  const taux = `${tauxOverride ?? t.tauxRemboursement} %`;
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  return [
    { categorie: "Honoraires médicaux",       actes: "Consultations, visites, actes de pratique médicale courante, petite chirurgie", taux, plafond: "Selon barème du Syndicat des Médecins Privés du Sénégal" },
    { categorie: "Pharmacie",                 actes: "Produits pharmaceutiques remboursés",                                           taux, plafond: "—" },
    { categorie: "Auxiliaires médicaux",      actes: "Soins infirmiers, Kinésithérapie / Rééducation, Traitements psychiatriques",   taux, plafond: "Soumis à entente préalable" },
    { categorie: "Analyses biologiques",      actes: "Analyses",                                                                     taux, plafond: "—" },
    { categorie: "Imagerie médicale",         actes: "Radio, Scanner et IRM en externe",                                             taux, plafond: "—" },
    { categorie: "Soins dentaires",           actes: "Soins et prothèses dentaires",                                                 taux, plafond: `${fmt(t.plafondDentaire)} FCFA / bénéficiaire` },
    { categorie: "Optique",                   actes: "Verres & montures",                                                            taux, plafond: `${fmt(t.plafondOptique)} FCFA / bénéficiaire · Renouvelable tous les 2 ans` },
    { categorie: "Hospitalisation — Clinique",actes: "Frais de chambre en hospitalisation médicale et frais annexes",               taux, plafond: `${fmt(t.plafondHospitalisationJour)} FCFA / jour` },
    { categorie: "Hospitalisation — Hôpital", actes: "Hospitalisation médicale",                                                    taux, plafond: "1ère catégorie de l'Hôpital Principal" },
    { categorie: "Orthophonie",               actes: "Séances d'orthophonie",                                                       taux, plafond: `${fmt(t.plafondOrthophonie)} FCFA / bénéficiaire / an` },
    { categorie: "Maternité — Simple",        actes: "Frais d'accouchement simple normal",                                          taux, plafond: `${fmt(t.plafondMaterniteSimple)} FCFA / évènement · Délai d'attente : 9 mois` },
    { categorie: "Maternité — Gémellaire",    actes: "Accouchement gémellaire normal",                                              taux, plafond: `${fmt(t.plafondMaterniteGemellaire)} FCFA / évènement` },
    { categorie: "Maternité — Chirurgical",   actes: "Accouchement par voie chirurgicale ou avec complications",                   taux, plafond: `${fmt(t.plafondMaterniteChirurgical)} FCFA / évènement` },
    { categorie: "Transport terrestre",       actes: "Transport par voie terrestre",                                                taux, plafond: `${fmt(t.plafondTransport)} FCFA / évènement` },
  ];
}

/** @deprecated Use getGarantiesCNART() */
export const GARANTIES_CNART = getGarantiesCNART();

export const REAJUSTEMENT_SP = [
  { rapport: "< 25 %",        ajustement: "−15 % (réduction)" },
  { rapport: "25 % – 50 %",   ajustement: "−10 % (réduction)" },
  { rapport: "50 % – 60 %",   ajustement: "−5 % (réduction)"  },
  { rapport: "60 % – 75 %",   ajustement: "Aucune modification" },
  { rapport: "75 % – 85 %",   ajustement: "+15 % (majoration)" },
  { rapport: "85 % – 100 %",  ajustement: "+30 % (majoration)" },
  { rapport: "100 % – 115 %", ajustement: "+35 % (majoration)" },
  { rapport: "115 % – 120 %", ajustement: "+50 % (majoration)" },
  { rapport: "120 % – 130 %", ajustement: "+55 % (majoration)" },
  { rapport: "130 % – 140 %", ajustement: "+85 % (majoration)" },
  { rapport: "> 140 %",       ajustement: "+95 % (majoration)" },
];

// ─── Calcul décompte ──────────────────────────────────────────────────────────

export function calcDecompte(
  beneficiaires: Beneficiaire[],
  typePrincipal: TypeAssure,
  tarifs?: TarifSettings,
) {
  const t = tarifs ?? TARIF_DEFAULTS;
  const tous = [{ type: typePrincipal }, ...beneficiaires];
  const nb: Record<TypeAssure, number> = { enfant: 0, adulte: 0, adulte_age: 0 };
  for (const p of tous) nb[p.type]++;
  const primeEnfants    = nb.enfant     * t.primeEnfant;
  const primeAdultes    = nb.adulte     * t.primeAdulte;
  const primeAdultesAge = nb.adulte_age * t.primeAdulteAge;
  const primeNette      = primeEnfants + primeAdultes + primeAdultesAge;
  const cp              = Math.round(primeNette * t.tauxCP / 100);
  const taxes           = Math.round((primeNette + cp) * t.tauxTaxe / 100);
  const total           = primeNette + cp + taxes;
  return { nb, primeEnfants, primeAdultes, primeAdultesAge, primeNette, cp, tauxCP: t.tauxCP, taxes, tauxTaxe: t.tauxTaxe, total };
}

export const DUREES = ["1", "2", "3"].map(v => ({ value: v, label: `${v} an${+v > 1 ? "s" : ""}` }));
