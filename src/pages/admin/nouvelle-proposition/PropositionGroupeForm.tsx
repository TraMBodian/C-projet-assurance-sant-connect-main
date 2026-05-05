import { useState, useMemo } from "react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Card }     from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calculator, Building2, User, FileText } from "@/components/ui/Icons";
import { toast } from "sonner";
import { getTarifs } from "@/services/tarifService";
import { DataService } from "@/services/dataService";
import OffreStep, {
  type OffrePopulation, type TarifsGroupe, OFFRE_VIDE,
} from "@/pages/admin/nouveau-groupe/OffreStep";
import type { PropositionGroupeData } from "./types";

// ─── Constantes ───────────────────────────────────────────────────────────────

const DUREES = [1, 2, 3];

// ─── Calcul prime estimée ─────────────────────────────────────────────────────

function calcPrimeGroupe(
  offre: OffrePopulation,
  tarifsPerso: TarifsGroupe | null,
  dureeAns: number,
): number {
  const t = getTarifs();
  const pa  = tarifsPerso?.primeAdulte    ?? t.primeAdulte;
  const pe  = tarifsPerso?.primeEnfant    ?? t.primeEnfant;
  const paa = tarifsPerso?.primeAdulteAge ?? t.primeAdulteAge;
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

  // Offre population + tarifs personnalisés (vient de OffreStep embedded)
  const [offre,       setOffre]       = useState<OffrePopulation>(OFFRE_VIDE);
  const [tarifsPerso, setTarifsPerso] = useState<TarifsGroupe | null>(null);

  // Infos entreprise
  const [entreprise,  setEntreprise]  = useState("");
  const [secteur,     setSecteur]     = useState("");
  const [contactNom,  setContactNom]  = useState("");
  const [contactEmail,setContactEmail]= useState("");
  const [contactTel,  setContactTel]  = useState("");

  // Conditions
  const [dureeAns,          setDureeAns]          = useState(1);
  const [dateDebut,         setDateDebut]         = useState("");
  const [tauxRemboursement, setTauxRemboursement] = useState(80);
  const [observations,      setObservations]      = useState("");

  const nbTotal = offre.adultes + offre.enfants + offre.personnesAgees;

  const primeEstimee = useMemo(
    () => calcPrimeGroupe(offre, tarifsPerso, dureeAns),
    [offre, tarifsPerso, dureeAns],
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

      {/* ── Prime estimée (affichée dès que l'offre est renseignée) ── */}
      {nbTotal > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ background: "#1B5299" }}>
            <Calculator className="w-4 h-4 shrink-0" />
            <p className="font-semibold text-sm">Prime estimée</p>
            {tarifsPerso && (
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                Tarifs personnalisés actifs
              </span>
            )}
            <span className="ml-auto text-xs opacity-80">indicative — sujet à validation</span>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: `Adultes × ${offre.adultes}`,                value: offre.adultes        * (tarifsPerso?.primeAdulte    ?? getTarifs().primeAdulte)   * dureeAns, show: offre.adultes > 0 },
              { label: `Enfants × ${offre.enfants}`,                value: offre.enfants        * (tarifsPerso?.primeEnfant    ?? getTarifs().primeEnfant)   * dureeAns, show: offre.enfants > 0 },
              { label: `Personnes âgées × ${offre.personnesAgees}`, value: offre.personnesAgees * (tarifsPerso?.primeAdulteAge ?? getTarifs().primeAdulteAge) * dureeAns, show: offre.personnesAgees > 0 },
            ].filter(r => r.show).map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono">{Math.round(r.value).toLocaleString("fr-FR")} FCFA</span>
              </div>
            ))}
            <div className="flex justify-between items-center -mx-4 -mb-4 px-4 py-3 mt-2 text-white" style={{ background: "#1B5299" }}>
              <span className="font-bold">TOTAL ESTIMÉ ({dureeAns} an{dureeAns > 1 ? "s" : ""})</span>
              <span className="font-bold text-lg font-mono">{primeEstimee.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
        </Card>
      )}

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
