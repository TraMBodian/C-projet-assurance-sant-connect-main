import { useState, useMemo } from "react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Card }     from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calculator, User, Users, FileText } from "@/components/ui/Icons";
import { toast }    from "sonner";
import { getTarifs } from "@/services/tarifService";
import { DataService } from "@/services/dataService";
import type { PropositionFamilleData } from "./types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DUREES = [1, 2, 3];

const GARANTIE_MULT: Record<string, number> = {
  Standard: 1,
  Confort:  1.25,
  Premium:  1.6,
};

// ─── Calcul prime estimée ─────────────────────────────────────────────────────

function calcPrime(
  nbAdultes: number,
  nbEnfants: number,
  nbPersonnesAgees: number,
  garantie: string,
  dureeAns: number,
): number {
  const t    = getTarifs();
  const mult = GARANTIE_MULT[garantie] ?? 1;
  const primeNette =
    (nbAdultes        * t.primeAdulte   +
     nbEnfants        * t.primeEnfant   +
     nbPersonnesAgees * t.primeAdulteAge) * mult;
  const cp    = Math.round(primeNette * t.tauxCP   / 100);
  const taxes = Math.round((primeNette + cp) * t.tauxTaxe / 100);
  return (primeNette + cp + taxes) * dureeAns;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onBack:   () => void;
  onSaved:  (propId: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PropositionFamilleForm({ onBack, onSaved }: Props) {
  const [isSaving, setIsSaving] = useState(false);

  const [souscripteurNom,     setSouscripteurNom]     = useState("");
  const [souscripteurEmail,   setSouscripteurEmail]   = useState("");
  const [souscripteurTel,     setSouscripteurTel]     = useState("");
  const [souscripteurAdresse, setSouscripteurAdresse] = useState("");

  const [nbAdultes,        setNbAdultes]        = useState(0);
  const [nbEnfants,        setNbEnfants]        = useState(0);
  const [nbPersonnesAgees, setNbPersonnesAgees] = useState(0);

  const [typeGarantie,      setTypeGarantie]      = useState<"Standard" | "Confort" | "Premium">("Standard");
  const [dureeAns,          setDureeAns]          = useState(1);
  const [dateDebut,         setDateDebut]         = useState("");
  const [tauxRemboursement, setTauxRemboursement] = useState(80);
  const [observations,      setObservations]      = useState("");

  const primeEstimee = useMemo(
    () => calcPrime(nbAdultes, nbEnfants, nbPersonnesAgees, typeGarantie, dureeAns),
    [nbAdultes, nbEnfants, nbPersonnesAgees, typeGarantie, dureeAns],
  );

  const nbTotal = nbAdultes + nbEnfants + nbPersonnesAgees;

  const handleSave = async (statut: "brouillon" | "envoyee") => {
    if (!souscripteurNom.trim()) {
      toast.error("Le nom du souscripteur est obligatoire");
      return;
    }
    if (nbTotal === 0) {
      toast.error("Ajoutez au moins une personne à assurer");
      return;
    }
    setIsSaving(true);
    try {
      const data: PropositionFamilleData = {
        souscripteurNom:     souscripteurNom.trim(),
        souscripteurEmail:   souscripteurEmail.trim(),
        souscripteurTel:     souscripteurTel.trim(),
        souscripteurAdresse: souscripteurAdresse.trim(),
        nbAdultes,
        nbEnfants,
        nbPersonnesAgees,
        typeGarantie,
        dureeAns,
        dateDebut,
        primeEstimee,
        tauxRemboursement,
        observations: observations.trim(),
      };
      const prop = DataService.createProposition({
        type:       "FAMILLE",
        statut,
        envoyeeAt:  statut === "envoyee" ? new Date().toISOString() : null,
        accepteeAt: null,
        policeId:   null,
        famille:    data,
        groupe:     null,
      });
      toast.success(statut === "envoyee"
        ? `Proposition ${prop.reference} envoyée`
        : `Brouillon ${prop.reference} sauvegardé`);
      onSaved(prop.id);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">

      {/* ── En-tête ── */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold">Proposition Maladie Famille</h2>
          <p className="text-sm text-muted-foreground">Assurance Maladie Individuelle / Familiale</p>
        </div>
      </div>

      {/* ── Souscripteur ── */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
          <User className="w-4 h-4 text-blue-600" /> Souscripteur
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Nom complet *</Label>
            <Input value={souscripteurNom} onChange={e => setSouscripteurNom(e.target.value)}
              placeholder="Mamadou Diallo" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={souscripteurEmail} onChange={e => setSouscripteurEmail(e.target.value)}
              placeholder="contact@exemple.sn" />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={souscripteurTel} onChange={e => setSouscripteurTel(e.target.value)}
              placeholder="+221 77 000 00 00" />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={souscripteurAdresse} onChange={e => setSouscripteurAdresse(e.target.value)}
              placeholder="Dakar, Sénégal" />
          </div>
        </div>
      </Card>

      {/* ── Population à assurer ── */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
          <Users className="w-4 h-4 text-blue-600" /> Population à assurer
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Adultes (21–59 ans)",     value: nbAdultes,        set: setNbAdultes,        color: "blue"   },
            { label: "Enfants (< 21 ans)",      value: nbEnfants,        set: setNbEnfants,        color: "green"  },
            { label: "Personnes âgées (60 ans+)",value: nbPersonnesAgees, set: setNbPersonnesAgees, color: "purple" },
          ].map(({ label, value, set, color }) => (
            <div key={label}>
              <Label className="text-xs">{label}</Label>
              <div className="flex items-center mt-1">
                <button type="button"
                  onClick={() => set(v => Math.max(0, v - 1))}
                  className={`w-8 h-9 rounded-l-lg border border-r-0 bg-gray-50 hover:bg-gray-100 font-bold text-${color}-600 transition-colors`}>
                  −
                </button>
                <input
                  type="number" min={0} value={value}
                  onChange={e => set(Math.max(0, Number(e.target.value) || 0))}
                  className={`w-full h-9 border-y text-center font-semibold text-${color}-700 bg-${color}-50 focus:outline-none focus:ring-1 focus:ring-${color}-400`}
                />
                <button type="button"
                  onClick={() => set(v => v + 1)}
                  className={`w-8 h-9 rounded-r-lg border border-l-0 bg-gray-50 hover:bg-gray-100 font-bold text-${color}-600 transition-colors`}>
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        {nbTotal > 0 && (
          <p className="text-xs text-muted-foreground bg-gray-50 rounded-lg px-3 py-2 border">
            Total : <strong>{nbTotal}</strong> personne{nbTotal > 1 ? "s" : ""} à assurer
          </p>
        )}
      </Card>

      {/* ── Formule de couverture ── */}
      <Card className="p-5 space-y-3">
        <h3 className="font-semibold text-base border-b pb-2">Formule de couverture</h3>
        <div className="grid grid-cols-3 gap-3">
          {([
            {
              val:         "Standard" as const,
              mult:        1,
              activeClass: "border-blue-500 bg-blue-50",
              labelClass:  "text-blue-700",
              badge:       "bg-blue-100 text-blue-700",
              desc:        "Soins courants · Pharmacie · Consultations généralistes",
            },
            {
              val:         "Confort" as const,
              mult:        1.25,
              activeClass: "border-indigo-500 bg-indigo-50",
              labelClass:  "text-indigo-700",
              badge:       "bg-indigo-100 text-indigo-700",
              desc:        "Standard + Spécialistes · Analyses · Radiologie",
            },
            {
              val:         "Premium" as const,
              mult:        1.6,
              activeClass: "border-purple-500 bg-purple-50",
              labelClass:  "text-purple-700",
              badge:       "bg-purple-100 text-purple-700",
              desc:        "Confort + Hospitalisation · Maternité · Chirurgie",
            },
          ]).map(({ val, mult, activeClass, labelClass, badge, desc }) => {
            const active = typeGarantie === val;
            return (
              <button key={val} type="button" onClick={() => setTypeGarantie(val)}
                className={`rounded-xl border-2 p-3 text-left transition-all focus:outline-none ${active ? activeClass : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? labelClass : "text-gray-500"}`}>{val}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${active ? badge : "bg-gray-100 text-gray-500"}`}>
                    ×{mult.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-snug">{desc}</p>
                {active && (
                  <div className={`mt-2 w-full h-0.5 rounded-full ${labelClass.replace("text-", "bg-")}`} />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Prime estimée ── */}
      {nbTotal > 0 && (() => {
        const t    = getTarifs();
        const mult = GARANTIE_MULT[typeGarantie] ?? 1;
        const unitA  = Math.round(t.primeAdulte    * mult);
        const unitE  = Math.round(t.primeEnfant    * mult);
        const unitAg = Math.round(t.primeAdulteAge * mult);
        const pA   = nbAdultes        * unitA;
        const pE   = nbEnfants        * unitE;
        const pAg  = nbPersonnesAgees * unitAg;
        const primeNette = pA + pE + pAg;
        const cp    = Math.round(primeNette * t.tauxCP   / 100);
        const taxes = Math.round((primeNette + cp) * t.tauxTaxe / 100);
        const sousTotal = primeNette + cp + taxes;
        return (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: "#1B5299" }}>
              <Calculator className="w-4 h-4 shrink-0" />
              <p className="font-semibold text-sm">Prime estimée</p>
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {typeGarantie} · ×{mult.toFixed(2)}
              </span>
              <span className="ml-auto text-xs opacity-70">indicative — sujet à validation</span>
            </div>

            {/* Grille des tarifs de base appliqués */}
            <div className="px-4 py-3 bg-gray-50 border-b">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Tarifs de base appliqués</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Adulte (21–59 ans)", base: t.primeAdulte, unit: unitA, show: true },
                  { label: "Enfant (< 21 ans)",  base: t.primeEnfant, unit: unitE, show: nbEnfants > 0 || true },
                  { label: "60 ans et plus",     base: t.primeAdulteAge, unit: unitAg, show: true },
                ].map(({ label, base, unit }) => (
                  <div key={label} className="bg-white border rounded-lg p-2 text-xs">
                    <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                    <p className="font-mono font-semibold text-gray-700">{base.toLocaleString("fr-FR")} <span className="font-normal text-gray-400">FCFA</span></p>
                    {mult > 1 && (
                      <p className="text-[10px] text-blue-600 mt-0.5 font-medium">→ {unit.toLocaleString("fr-FR")} FCFA</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="divide-y">
              {[
                { label: `Adultes × ${nbAdultes} · ${unitA.toLocaleString("fr-FR")} FCFA/pers`,               value: pA,  show: nbAdultes > 0 },
                { label: `Enfants × ${nbEnfants} · ${unitE.toLocaleString("fr-FR")} FCFA/pers`,               value: pE,  show: nbEnfants > 0 },
                { label: `Pers. âgées × ${nbPersonnesAgees} · ${unitAg.toLocaleString("fr-FR")} FCFA/pers`,  value: pAg, show: nbPersonnesAgees > 0 },
              ].filter(r => r.show).map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-mono">{r.value.toLocaleString("fr-FR")} FCFA</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2.5 text-sm bg-blue-50 font-semibold">
                <span>Prime nette ({typeGarantie})</span>
                <span className="font-mono text-blue-700">{primeNette.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Coût de police ({t.tauxCP} %)</span>
                <span className="font-mono">{cp.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Taxes ({t.tauxTaxe} %)</span>
                <span className="font-mono">{taxes.toLocaleString("fr-FR")} FCFA</span>
              </div>
              {dureeAns > 1 && (
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Sous-total (1 an)</span>
                  <span className="font-mono">{sousTotal.toLocaleString("fr-FR")} FCFA</span>
                </div>
              )}
              <div className="flex justify-between items-center px-4 py-3 text-white font-bold" style={{ background: "#1B5299" }}>
                <span>TOTAL ESTIMÉ ({dureeAns} an{dureeAns > 1 ? "s" : ""})</span>
                <span className="text-lg font-mono">{primeEstimee.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
          </Card>
        );
      })()}

      {/* ── Durée & Conditions ── */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-base border-b pb-2">Durée & Conditions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Durée souhaitée</Label>
            <Select value={String(dureeAns)} onValueChange={v => setDureeAns(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DUREES.map(d => (
                  <SelectItem key={d} value={String(d)}>{d} an{d > 1 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date de début souhaitée</Label>
            <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          </div>
          <div>
            <Label>Taux de remboursement (%)</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number" min={0} max={100}
                value={tauxRemboursement}
                onChange={e => setTauxRemboursement(Number(e.target.value))}
                className="text-right font-mono"
              />
              <span className="text-sm text-muted-foreground shrink-0">%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Observations ── */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
          <FileText className="w-4 h-4 text-blue-600" /> Observations
        </h3>
        <textarea
          value={observations}
          onChange={e => setObservations(e.target.value)}
          rows={3}
          placeholder="Besoins spécifiques, conditions particulières, notes internes…"
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 py-5" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
        <Button
          variant="outline"
          className="flex-1 py-5 border-blue-300 text-blue-700 hover:bg-blue-50"
          disabled={isSaving}
          onClick={() => handleSave("brouillon")}
        >
          <Save className="w-4 h-4 mr-2" /> Sauvegarder brouillon
        </Button>
        <Button
          className="flex-[2] py-5 text-base gap-2 bg-blue-600 hover:bg-blue-700"
          disabled={isSaving || !souscripteurNom.trim() || nbTotal === 0}
          onClick={() => handleSave("envoyee")}
        >
          <Save className="w-4 h-4" /> Envoyer la proposition
        </Button>
      </div>
    </div>
  );
}
