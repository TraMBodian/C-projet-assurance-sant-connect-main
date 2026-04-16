// ─── Service de gestion des tarifs (stockage localStorage) ───────────────────
// Permet à l'administrateur de modifier les primes et taux sans redéploiement.

export interface TarifSettings {
  primeEnfant:    number;   // FCFA par enfant (< 21 ans)
  primeAdulte:    number;   // FCFA par adulte (21–59 ans)
  primeAdulteAge: number;   // FCFA par personne âgée (60 ans et +)
  tauxTaxe:       number;   // en %, ex: 10.6
  tauxCP:         number;   // Chargements Professionnels en %, ex: 10
}

export const TARIF_DEFAULTS: TarifSettings = {
  primeEnfant:    237_500,
  primeAdulte:    475_000,
  primeAdulteAge: 712_500,
  tauxTaxe:       10,
  tauxCP:         10,
};

const STORAGE_KEY = "cnart_tarifs";

export function getTarifs(): TarifSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...TARIF_DEFAULTS };
    return { ...TARIF_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...TARIF_DEFAULTS };
  }
}

export function saveTarifs(t: TarifSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}
