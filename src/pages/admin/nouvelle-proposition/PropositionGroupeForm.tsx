import { useState, useMemo } from "react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Card }     from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calculator, Building2, User, FileText, Shield, Star, Zap } from "@/components/ui/Icons";
import { toast } from "sonner";
import { getTarifs } from "@/services/tarifService";
import { DataService } from "@/services/dataService";
import OffreStep, {
  type OffrePopulation, type TarifsGroupe, OFFRE_VIDE,
} from "@/pages/admin/nouveau-groupe/OffreStep";
import type { PropositionGroupeData } from "./types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DUREES = [1, 2, 3];

const GARANTIE_MULT: Record<string, number> = {
  Standard: 1.00,
  Confort:  1.25,
  Premium:  1.60,
};

const GARANTIES = [
  {
    id:    "Standard" as const,
    label: "Standard",
    desc:  "Couverture essentielle",
    icon:  Shield,
    color: "border-blue-300 bg-blue-50/60 text-blue-700",
    ring:  "ring-blue-500",
    badge: "bg-blue-100 text-blue-800",
    mult:  "×1.00",
  },
  {
    id:    "Confort" as const,
    label: "Confort",
    desc:  "Couverture étendue",
    icon:  Star,
    color: "border-indigo-300 bg-indigo-50/60 text-indigo-700",
    ring:  "ring-indigo-500",
    badge: "bg-indigo-100 text-indigo-800",
    mult:  "×1.25",
  },
  {
    id:    "Premium" as const,
    label: "Premium",
    desc:  "Couverture maximale",
    icon:  Zap,
    color: "border-amber-400 bg-amber-50/60 text-amber-700",
    ring:  "ring-amber-500",
    badge: "bg-amber-100 text-amber-800",
    mult:  "×1.60",
  },
];

// ─── Calcul prime estimée ─────────────────────────────────────────────────────

function calcPrimeGroupe(
  offre: OffrePopulation,
  tarifsPerso: TarifsGroupe | null,
  typeGarantie: string,
  dureeAns: number,
): number {
  const t    = getTarifs();
  const mult = GARANTIE_MULT[typeGarantie] ?? 1;
  const pa  = (tarifsPerso?.primeAdulte    ?? t.primeAdulte)   * mult;
  const pe  = (tarifsPerso?.primeEnfant    ?? t.primeEnfant)   * mult;
  const paa = (tarifsPerso?.primeAdulteAge ?? t.primeAdulteAge) * mult;
  const primeNette = offre.adultes * pa + offre.enfants * pe + offre.personnesAgees * paa;
  const cp    = Math.round(primeNette * t.tauxCP   / 100);
  const taxes = Math.round((primeNette + cp) * t.tauxTaxe / 100);
  return (primeNette + cp + taxes) * dureeAns;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onBack:  () => void;
  onSaved: (propId: string) => void;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PropositionGroupeForm({ onBack, onSaved }: Props) {
  const [isSaving, setIsSaving] = useState(false);

  const [offre,        setOffre]        = useState<OffrePopulation>(OFFRE_VIDE);
  const [tarifsPerso,  setTarifsPerso]  = useState<TarifsGroupe | null>(null);
  const [typeGarantie, setTypeGarantie] = useState<'Standard' | 'Confort' | 'Premium'>("Standard");

  const [entreprise,   setEntreprise]   = useState("");
  const [secteur,      setSecteur]      = useState("");
  const [contactNom,   setContactNom]   = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactTel,   setContactTel]   = useState("");

  const [dureeAns,          setDureeAns]          = useState(1);
  const [dateDebut,         setDateDebut]         = useState("");
  const [tauxRemboursement, setTauxRemboursement] = useState(80);
  const [observations,      setObservations]      = useState("");

  const nbTotal = offre.adultes + offre.enfants + offre.personnesAgees;

  const primeEstimee = useMemo(
    () => calcPrimeGroupe(offre, tarifsPerso, typeGarantie, dureeAns),
    [offre, tarifsPerso, typeGarantie, dureeAns],
  );

  const handleSave = async (statut: "brouillon" | "envoyee") => {
    if (!entreprise.trim()) {
      toast.error("Le nom de l'entreprise est obligatoire");
      return;
    }
    if (nbTotal === 0) {
      toast.error("Renseignez la taille estimée de la population");
      return;
    }
    setIsSaving(true);
    try {
      const data: PropositionGroupeData = {
        entreprise:          entreprise.trim(),
        secteur:             secteur.trim(),
        contactNom:          contactNom.trim(),
        contactEmail:        contactEmail.trim(),
        contactTel:          contactTel.trim(),
        nbAdultes:           offre.adultes,
        nbEnfants:           offre.enfants,
        nbPersonnesAgees:    offre.personnesAgees,
        typeGarantie,
        dureeAns,
        dateDebut,
        primeEstimee,
        tauxRemboursement,
        tarifsPersoAdulte:    tarifsPerso?.primeAdulte    ?? null,
        tarifsPersoEnfant:    tarifsPerso?.primeEnfant    ?? null,
        tarifsPersoAdulteAge: tarifsPerso?.primeAdulteAge ?? null,
        observations:         observations.trim(),
      };
      const prop = DataService.createProposition({
        type:       "GROUPE",
        statut,
        envoyeeAt:  statut === "envoyee" ? new Date().toISOString() : null,
        accepteeAt: null,
        policeId:   null,
        famille:    null,
        groupe:     data,
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
          <h2 className="text-xl font-bold">Proposition Maladie Groupe</h2>
          <p className="text-sm text-muted-foreground">Assurance Maladie Collective — Entreprise</p>
        </div>
      </div>

      {/* ── Formule de garantie ── */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="font-semibold text-base">Formule de garantie</h3>
          <span className="text-xs text-muted-foreground">Sélectionnez le niveau de couverture</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {GARANTIES.map(g => {
            const Icon = g.icon;
            const selected = typeGarantie === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setTypeGarantie(g.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                  selected
                    ? `${g.color} ring-2 ${g.ring} ring-offset-1`
                    : "border-gray-200 bg-white hover:border-gray-300 text-gray-500"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? "bg-white/70" : "bg-gray-100"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{g.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{g.desc}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selected ? g.badge : "bg-gray-100 text-gray-500"}`}>
                  {g.mult}
                </span>
                {selected && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current opacity-70" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Offre population (OffreStep embarqué) ── */}
      <Card className="overflow-hidden">
        <OffreStep
          offre={offre}
          onChange={setOffre}
          onContinue={() => {}}
          tarifsPerso={tarifsPerso}
          onTarifsPersoChange={setTarifsPerso}
          embedded
        />
      </Card>

      {/* ── Prime estimée ── */}
      {nbTotal > 0 && (() => {
        const t    = getTarifs();
        const mult = GARANTIE_MULT[typeGarantie] ?? 1;
        const pA  = offre.adultes        * (tarifsPerso?.primeAdulte    ?? t.primeAdulte)   * mult;
        const pE  = offre.enfants        * (tarifsPerso?.primeEnfant    ?? t.primeEnfant)   * mult;
        const pAg = offre.personnesAgees * (tarifsPerso?.primeAdulteAge ?? t.primeAdulteAge) * mult;
        const primeNette = pA + pE + pAg;
        const cp    = Math.round(primeNette * t.tauxCP   / 100);
        const taxes = Math.round((primeNette + cp) * t.tauxTaxe / 100);
        const sousTotal = primeNette + cp + taxes;
        return (
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: "#1B5299" }}>
              <Calculator className="w-4 h-4 shrink-0" />
              <p className="font-semibold text-sm">Prime estimée — {typeGarantie}</p>
              {tarifsPerso && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  Tarifs personnalisés
                </span>
              )}
              <span className="ml-auto text-xs opacity-80">indicative — sujet à validation</span>
            </div>
            <div className="divide-y">
              {[
                { label: `Adultes × ${offre.adultes}`,                value: pA,  show: offre.adultes > 0 },
                { label: `Enfants × ${offre.enfants}`,                value: pE,  show: offre.enfants > 0 },
                { label: `Personnes âgées × ${offre.personnesAgees}`, value: pAg, show: offre.personnesAgees > 0 },
              ].filter(r => r.show).map(r => (
                <div key={r.label} className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-mono">{Math.round(r.value).toLocaleString("fr-FR")} FCFA</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2.5 text-sm bg-blue-50 font-semibold">
                <span>Prime nette</span>
                <span className="font-mono text-blue-700">{Math.round(primeNette).toLocaleString("fr-FR")} FCFA</span>
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
                  <span className="font-mono">{Math.round(sousTotal).toLocaleString("fr-FR")} FCFA</span>
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

      {/* ── Entreprise ── */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
          <Building2 className="w-4 h-4 text-blue-600" /> Entreprise
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Nom de l'entreprise *</Label>
            <Input value={entreprise} onChange={e => setEntreprise(e.target.value)}
              placeholder="Sonatel SA" />
          </div>
          <div>
            <Label>Secteur d'activité</Label>
            <Input value={secteur} onChange={e => setSecteur(e.target.value)}
              placeholder="Télécommunications, Finance…" />
          </div>
        </div>
      </Card>

      {/* ── Contact ── */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
          <User className="w-4 h-4 text-blue-600" /> Interlocuteur
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Nom & Prénom</Label>
            <Input value={contactNom} onChange={e => setContactNom(e.target.value)}
              placeholder="Ibrahima Diallo" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
              placeholder="rh@entreprise.sn" />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={contactTel} onChange={e => setContactTel(e.target.value)}
              placeholder="+221 33 000 00 00" />
          </div>
        </div>
      </Card>

      {/* ── Conditions ── */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-base border-b pb-2">Conditions</h3>
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
          disabled={isSaving || !entreprise.trim() || nbTotal === 0}
          onClick={() => handleSave("envoyee")}
        >
          <Save className="w-4 h-4" /> Envoyer la proposition
        </Button>
      </div>
    </div>
  );
}
