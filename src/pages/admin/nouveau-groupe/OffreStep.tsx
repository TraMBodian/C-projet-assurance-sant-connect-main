import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users } from "@/components/ui/Icons";
import { getTarifs } from "@/services/tarifService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OffrePopulation {
  adultes:        number;
  enfants:        number;
  personnesAgees: number;
}

export interface TarifsGroupe {
  primeAdulte:    number;
  primeEnfant:    number;
  primeAdulteAge: number;
}

export const OFFRE_VIDE: OffrePopulation = { adultes: 0, enfants: 0, personnesAgees: 0 };

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  offre:                 OffrePopulation;
  onChange:              (offre: OffrePopulation) => void;
  onContinue:            () => void;
  tarifsPerso?:          TarifsGroupe | null;
  onTarifsPersoChange?:  (t: TarifsGroupe | null) => void;
  /** Masque le AppLayout — utile quand OffreStep est embarqué dans une autre page */
  embedded?:             boolean;
}

const POPULATION_CONFIG = [
  { key: "adultes"        as const, label: "Adultes",          sub: "21 – 59 ans",     bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   bar: "#1B5299" },
  { key: "enfants"        as const, label: "Enfants",          sub: "Moins de 21 ans", bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  bar: "#16a34a" },
  { key: "personnesAgees" as const, label: "Personnes âgées",  sub: "60 ans et plus",  bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", bar: "#7c3aed" },
] as const;

const TARIF_CONFIG = [
  { key: "primeAdulte"    as const, label: "Prime adulte",          color: "#1B5299" },
  { key: "primeEnfant"    as const, label: "Prime enfant",          color: "#16a34a" },
  { key: "primeAdulteAge" as const, label: "Prime personne âgée",   color: "#7c3aed" },
] as const;

export default function OffreStep({
  offre, onChange, onContinue,
  tarifsPerso, onTarifsPersoChange,
  embedded = false,
}: Props) {
  const navigate = useNavigate();
  const tarifsGlobaux = getTarifs();

  const [customEnabled, setCustomEnabled] = useState(!!tarifsPerso);

  const set = (key: keyof OffrePopulation, raw: string) =>
    onChange({ ...offre, [key]: Math.max(0, parseInt(raw) || 0) });

  const increment = (key: keyof OffrePopulation, delta: number) =>
    onChange({ ...offre, [key]: Math.max(0, offre[key] + delta) });

  const toggleCustom = (enabled: boolean) => {
    setCustomEnabled(enabled);
    if (!enabled) {
      onTarifsPersoChange?.(null);
    } else {
      onTarifsPersoChange?.({
        primeAdulte:    tarifsGlobaux.primeAdulte,
        primeEnfant:    tarifsGlobaux.primeEnfant,
        primeAdulteAge: tarifsGlobaux.primeAdulteAge,
      });
    }
  };

  const setTarif = (key: keyof TarifsGroupe, raw: string) => {
    const val = Math.max(0, parseInt(raw.replace(/\s/g, "")) || 0);
    onTarifsPersoChange?.({
      primeAdulte:    tarifsPerso?.primeAdulte    ?? tarifsGlobaux.primeAdulte,
      primeEnfant:    tarifsPerso?.primeEnfant    ?? tarifsGlobaux.primeEnfant,
      primeAdulteAge: tarifsPerso?.primeAdulteAge ?? tarifsGlobaux.primeAdulteAge,
      [key]: val,
    });
  };

  // Tarifs effectifs : personnalisés si activés, sinon globaux
  const eff = {
    primeAdulte:    customEnabled && tarifsPerso ? tarifsPerso.primeAdulte    : tarifsGlobaux.primeAdulte,
    primeEnfant:    customEnabled && tarifsPerso ? tarifsPerso.primeEnfant    : tarifsGlobaux.primeEnfant,
    primeAdulteAge: customEnabled && tarifsPerso ? tarifsPerso.primeAdulteAge : tarifsGlobaux.primeAdulteAge,
  };

  const total        = offre.adultes + offre.enfants + offre.personnesAgees;
  const canContinue  = total > 0;
  const primeAdultes = offre.adultes       * eff.primeAdulte;
  const primeEnfants = offre.enfants       * eff.primeEnfant;
  const primeAges    = offre.personnesAgees * eff.primeAdulteAge;
  const primeNette   = primeAdultes + primeEnfants + primeAges;
  const cp           = Math.round(primeNette * tarifsGlobaux.tauxCP   / 100);
  const taxes        = Math.round((primeNette + cp) * tarifsGlobaux.tauxTaxe / 100);
  const totalAPayer  = primeNette + cp + taxes;

  const fcfa = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

  const body = (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

      {/* En-tête étape */}
      {!embedded && (
        <div className="rounded-2xl p-5 text-white" style={{ background: "#1B5299" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-sm">1/3</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Proposition de l'offre</h1>
              <p className="text-white/80 text-xs">Étape 1 — Définissez la population avant de saisir le contrat</p>
            </div>
          </div>
        </div>
      )}

      {/* Saisie population */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Répartition de la population assurée
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {POPULATION_CONFIG.map(({ key, label, sub, bg, border, text, bar }) => (
            <div key={key} className={`rounded-xl border p-4 ${bg} ${border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold text-base ${text}`}>{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => increment(key, -1)} disabled={offre[key] === 0}
                    className="w-8 h-8 rounded-full border flex items-center justify-center text-lg font-bold transition-colors hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: bar, color: bar }}>−</button>
                  <input type="number" min={0}
                    value={offre[key] === 0 ? "" : offre[key]}
                    onChange={e => set(key, e.target.value)}
                    placeholder="0"
                    className={`w-20 text-center font-bold text-xl border-2 rounded-lg py-1 bg-white focus:outline-none focus:ring-2 ${text}`}
                    style={{ borderColor: bar }} />
                  <button type="button" onClick={() => increment(key, 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: bar }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tarification — variable ou par défaut */}
      {onTarifsPersoChange && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-semibold text-base">Tarification</h2>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-muted-foreground">
                {customEnabled ? "Tarifs personnalisés" : "Tarifs par défaut"}
              </span>
              <div
                onClick={() => toggleCustom(!customEnabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${customEnabled ? "bg-blue-600" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${customEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </label>
          </div>

          {!customEnabled && (
            <p className="text-xs text-muted-foreground">
              Les tarifs globaux définis dans les paramètres seront appliqués.
            </p>
          )}

          {customEnabled && (
            <div className="grid grid-cols-1 gap-3">
              {TARIF_CONFIG.map(({ key, label, color }) => {
                const val = tarifsPerso?.[key] ?? tarifsGlobaux[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                    <label className="text-sm text-gray-700 flex-1">{label}</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min={0}
                        value={val}
                        onChange={e => setTarif(key, e.target.value)}
                        className="w-36 text-right border rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300"
                        style={{ borderColor: color + "80" }}
                      />
                      <span className="text-xs text-muted-foreground">FCFA</span>
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                Ces tarifs s'appliqueront uniquement à ce groupe et n'affectent pas les tarifs globaux.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Synthèse visuelle */}
      {total > 0 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Synthèse de la population</h3>
            <span className="text-sm font-bold" style={{ color: "#1B5299" }}>
              {total} assuré{total > 1 ? "s" : ""} au total
            </span>
          </div>
          <div className="space-y-2">
            {POPULATION_CONFIG.map(({ key, label, bar }) => {
              const pct = Math.round((offre[key] / total) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 shrink-0">{label} ({offre[key]})</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: bar }} />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right" style={{ color: bar }}>{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="flex rounded-full overflow-hidden h-4 gap-px mt-1">
            {POPULATION_CONFIG.map(({ key, bar }) => {
              const pct = offre[key] / total * 100;
              return pct > 0 ? (
                <div key={key} className="transition-all duration-500"
                  style={{ width: `${pct}%`, background: bar }}
                  title={`${POPULATION_CONFIG.find(c => c.key === key)?.label} : ${offre[key]}`} />
              ) : null;
            })}
          </div>
        </Card>
      )}

      {/* Décompte estimatif */}
      {total > 0 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-sm" style={{ color: "#1B5299" }}>Décompte estimatif des primes</h3>
            {customEnabled && (
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Tarifs personnalisés
              </span>
            )}
          </div>
          <table className="w-full text-xs">
            <tbody>
              {offre.adultes > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-600">Adultes ({offre.adultes} × {fcfa(eff.primeAdulte)})</td>
                  <td className="py-1.5 text-right font-semibold text-blue-700">{fcfa(primeAdultes)}</td>
                </tr>
              )}
              {offre.enfants > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-600">Enfants ({offre.enfants} × {fcfa(eff.primeEnfant)})</td>
                  <td className="py-1.5 text-right font-semibold text-green-700">{fcfa(primeEnfants)}</td>
                </tr>
              )}
              {offre.personnesAgees > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-1.5 text-gray-600">Personnes âgées ({offre.personnesAgees} × {fcfa(eff.primeAdulteAge)})</td>
                  <td className="py-1.5 text-right font-semibold text-purple-700">{fcfa(primeAges)}</td>
                </tr>
              )}
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-gray-600">Prime nette</td>
                <td className="py-1.5 text-right font-semibold">{fcfa(primeNette)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-gray-500">Coût de police ({tarifsGlobaux.tauxCP}%)</td>
                <td className="py-1.5 text-right text-gray-600">{fcfa(cp)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1.5 text-gray-500">Taxes ({tarifsGlobaux.tauxTaxe}%)</td>
                <td className="py-1.5 text-right text-gray-600">{fcfa(taxes)}</td>
              </tr>
              <tr>
                <td className="pt-2 font-bold text-sm text-white rounded-l-lg px-3" style={{ background: "#1B5299" }}>TOTAL À PAYER</td>
                <td className="pt-2 font-black text-sm text-white text-right rounded-r-lg px-3" style={{ background: "#1B5299" }}>{fcfa(totalAPayer)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
            Estimation basée sur les tarifs {customEnabled ? "personnalisés" : "actuels"}. Le montant définitif sera confirmé à l'étape suivante.
          </p>
        </Card>
      )}

      {!canContinue && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
          Veuillez renseigner au moins une personne pour continuer.
        </p>
      )}

      {!embedded && (
        <div className="flex justify-between gap-3">
          <Button variant="destructive" onClick={() => navigate("/admin/maladie-groupe")}>Annuler</Button>
          <Button disabled={!canContinue} onClick={onContinue} style={{ background: canContinue ? "#1B5299" : undefined }}>
            Continuer vers la demande →
          </Button>
        </div>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <AppLayout subHeader={
      <Button size="sm" onClick={() => navigate("/admin/maladie-groupe")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      {body}
    </AppLayout>
  );
}
