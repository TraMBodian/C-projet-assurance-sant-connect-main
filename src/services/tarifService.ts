// Service tarifs — persistés en BDD via /api/tarifs (suppression localStorage)
import { apiClient } from './apiClient';

export interface TarifSettings {
  primeEnfant:                 number;
  primeAdulte:                 number;
  primeAdulteAge:              number;
  tauxTaxe:                    number;
  tauxCP:                      number;
  tauxRemboursement:           number;
  plafondDentaire:             number;
  plafondOptique:              number;
  plafondHospitalisationJour:  number;
  plafondOrthophonie:          number;
  plafondMaterniteSimple:      number;
  plafondMaterniteGemellaire:  number;
  plafondMaterniteChirurgical: number;
  plafondTransport:            number;
}

export const TARIF_DEFAULTS: TarifSettings = {
  primeEnfant:                 237_500,
  primeAdulte:                 475_000,
  primeAdulteAge:              712_500,
  tauxTaxe:                    10,
  tauxCP:                      10,
  tauxRemboursement:           80,
  plafondDentaire:             250_000,
  plafondOptique:              250_000,
  plafondHospitalisationJour:  45_000,
  plafondOrthophonie:          100_000,
  plafondMaterniteSimple:      400_000,
  plafondMaterniteGemellaire:  500_000,
  plafondMaterniteChirurgical: 600_000,
  plafondTransport:            100_000,
};

/** Charge les tarifs depuis le backend (fallback sur les défauts si erreur réseau) */
export async function getTarifs(): Promise<TarifSettings> {
  try {
    const res = await apiClient.request<any>('/tarifs');
    const t = res?.data ?? res;
    return { ...TARIF_DEFAULTS, ...t };
  } catch {
    return { ...TARIF_DEFAULTS };
  }
}

/** Enregistre les tarifs en BDD via PUT /api/tarifs */
export async function saveTarifs(t: TarifSettings): Promise<TarifSettings> {
  const res = await apiClient.request<any>('/tarifs', {
    method: 'PUT',
    body: JSON.stringify(t),
  });
  return res?.data ?? res;
}
