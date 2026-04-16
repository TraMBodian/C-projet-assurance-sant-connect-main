import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X, RefreshCw, ChevronDown, ChevronUp, User, Users } from "lucide-react";
import { toast } from "sonner";
import { DataService } from "@/services/dataService";
import { getTarifs, type TarifSettings } from "@/services/tarifService";
import { PhotoUpload } from "@/components/PhotoUpload";

// ─── Constantes CNART (valeurs par défaut — surchargées par les tarifs admin) ──

export const PRIME_ENFANT     = 237_500;   // FCFA  (< 21 ans)
export const PRIME_ADULTE     = 475_000;   // FCFA  (21 – 59 ans)
export const PRIME_ADULTE_AGE = 712_500;   // FCFA  (60 ans et +)
export const TAUX_TAXE        = 0.10;      // 10 % (taux par défaut)

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
  enfant:     "bg-green-50 border-green-200 text-green-700",
  adulte:     "bg-blue-50 border-blue-200 text-blue-700",
  adulte_age: "bg-purple-50 border-purple-200 text-purple-700",
};

/** Détermine la catégorie automatiquement depuis la date de naissance */
export function typeFromDate(dateNaissance: string): TypeAssure {
  if (!dateNaissance) return "adulte";
  const age = Math.floor((Date.now() - new Date(dateNaissance).getTime()) / (365.25 * 86_400_000));
  if (age < 21)  return "enfant";
  if (age >= 60) return "adulte_age";
  return "adulte";
}

export interface Beneficiaire {
  nom:           string;
  lien:          string;
  type:          TypeAssure;
  dateNaissance: string;
  lieuNaissance: string;
  email:         string;
  telephone:     string;
}

// ─── Tableau des garanties (source : CNART Assurances) ────────────────────────

export const GARANTIES_CNART = [
  { categorie: "Honoraires médicaux",    actes: "Consultations, visites, actes de pratique médicale courante, petite chirurgie", taux: "80 %", plafond: "Selon barème du Syndicat des Médecins Privés du Sénégal" },
  { categorie: "Pharmacie",              actes: "Produits pharmaceutiques remboursés",                                           taux: "80 %", plafond: "—" },
  { categorie: "Auxiliaires médicaux",   actes: "Soins infirmiers, Kinésithérapie / Rééducation, Traitements psychiatriques",   taux: "80 %", plafond: "Soumis à entente préalable" },
  { categorie: "Analyses biologiques",   actes: "Analyses",                                                                     taux: "80 %", plafond: "—" },
  { categorie: "Imagerie médicale",      actes: "Radio, Scanner et IRM en externe",                                             taux: "80 %", plafond: "—" },
  { categorie: "Soins dentaires",        actes: "Soins et prothèses dentaires",                                                 taux: "80 %", plafond: "250 000 FCFA / bénéficiaire" },
  { categorie: "Optique",                actes: "Verres & montures",                                                            taux: "80 %", plafond: "250 000 FCFA / bénéficiaire · Renouvelable tous les 2 ans" },
  { categorie: "Hospitalisation — Clinique", actes: "Frais de chambre en hospitalisation médicale et frais annexes",           taux: "80 %", plafond: "45 000 FCFA / jour" },
  { categorie: "Hospitalisation — Hôpital", actes: "Hospitalisation médicale",                                                 taux: "80 %", plafond: "1ère catégorie de l'Hôpital Principal" },
  { categorie: "Orthophonie",            actes: "Séances d'orthophonie",                                                       taux: "80 %", plafond: "100 000 FCFA / bénéficiaire / an" },
  { categorie: "Maternité — Simple",     actes: "Frais d'accouchement simple normal",                                          taux: "80 %", plafond: "400 000 FCFA / évènement · Délai d'attente : 9 mois" },
  { categorie: "Maternité — Gémellaire", actes: "Accouchement gémellaire normal",                                              taux: "80 %", plafond: "500 000 FCFA / évènement" },
  { categorie: "Maternité — Chirurgical",actes: "Accouchement par voie chirurgicale ou avec complications",                    taux: "80 %", plafond: "600 000 FCFA / évènement" },
  { categorie: "Transport terrestre",    actes: "Transport par voie terrestre",                                                 taux: "80 %", plafond: "100 000 FCFA / évènement" },
];

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
// Formule : Prime Nette = Σ primes population
//           CP          = Prime Nette × tauxCP %  (variable)
//           Taxes       = Prime Nette × tauxTaxe %
//           Total       = Prime Nette + CP + Taxes

export function calcDecompte(
  beneficiaires: Beneficiaire[],
  typePrincipal: TypeAssure,
  tarifs?: TarifSettings,
) {
  const t = tarifs ?? getTarifs();
  const tous = [{ type: typePrincipal }, ...beneficiaires];
  const nb: Record<TypeAssure, number> = { enfant: 0, adulte: 0, adulte_age: 0 };
  for (const p of tous) nb[p.type]++;
  const primeEnfants    = nb.enfant     * t.primeEnfant;
  const primeAdultes    = nb.adulte     * t.primeAdulte;
  const primeAdultesAge = nb.adulte_age * t.primeAdulteAge;
  const primeNette      = primeEnfants + primeAdultes + primeAdultesAge;
  const cp              = Math.round(primeNette * t.tauxCP   / 100);
  const taxes           = Math.round(primeNette * t.tauxTaxe / 100);
  const total           = primeNette + cp + taxes;
  return { nb, primeEnfants, primeAdultes, primeAdultesAge, primeNette, cp, tauxCP: t.tauxCP, taxes, tauxTaxe: t.tauxTaxe, total };
}

const DUREES = ["1", "2", "3"].map(v => ({ value: v, label: `${v} an${+v > 1 ? "s" : ""}` }));

function newBeneficiaire(): Beneficiaire {
  return { nom: "", lien: "", type: "adulte", dateNaissance: "", lieuNaissance: "", email: "", telephone: "" };
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function NewFamillePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editingId, setEditingId]         = useState<number | null>(null);
  const [showGaranties, setShowGaranties] = useState(false);
  const [showReajust, setShowReajust]     = useState(false);
  const [expandedBen, setExpandedBen]     = useState<number | null>(null);

  const [photo, setPhoto] = useState<string>("");
  const [souscripteur, setSouscripteur] = useState({
    nom:           "",
    dateNaissance: "",
    lieuNaissance: "",
    telephone:     "",
    email:         "",
    adresse:       "",
    type:          "adulte" as TypeAssure,
  });
  const [formData, setFormData] = useState({
    dateDebut:     "",
    dureeGarantie: "1",
    echeanceAuto:  true,
  });
  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([newBeneficiaire()]);
  const [tarifs, setTarifs] = useState<TarifSettings>(() => ({
    ...getTarifs(),
    primeEnfant: 0,
    primeAdulte: 0,
    primeAdulteAge: 0,
  }));
  const [cpManuel,          setCpManuel]          = useState<string>("");
  const [tauxRemboursement, setTauxRemboursement] = useState<number>(0);

  const dateFin = useMemo(() => {
    if (!formData.dateDebut) return "";
    const d = new Date(formData.dateDebut);
    d.setFullYear(d.getFullYear() + Number(formData.dureeGarantie));
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("fr-FR");
  }, [formData.dateDebut, formData.dureeGarantie]);

  const decompte = useMemo(
    () => calcDecompte(beneficiaires, souscripteur.type, tarifs),
    [beneficiaires, souscripteur.type, tarifs]
  );
  const tauxCpEffectif = cpManuel !== "" && !isNaN(Number(cpManuel)) ? Number(cpManuel) : decompte.tauxCP;
  const cpEffectif     = Math.round(decompte.primeNette * tauxCpEffectif / 100);
  const totalEffectif  = decompte.primeNette + cpEffectif + decompte.taxes;

  const addBeneficiaire = () => {
    setBeneficiaires(prev => [...prev, newBeneficiaire()]);
    setExpandedBen(beneficiaires.length);
  };
  const removeBeneficiaire = (i: number) => {
    setBeneficiaires(prev => prev.filter((_, idx) => idx !== i));
    setExpandedBen(null);
  };
  const updateBen = (i: number, field: keyof Beneficiaire, value: string) => {
    setBeneficiaires(prev => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      // Auto-catégoriser à partir de la date de naissance
      if (field === "dateNaissance" && value) {
        updated[i].type = typeFromDate(value);
      }
      return updated;
    });
  };

  useEffect(() => {
    const idParam = Number(searchParams.get("id"));
    if (!idParam) return;
    setEditingId(idParam);
    DataService.getFamilleById(idParam)
      .then((famille) => {
        if (!famille) return;
        if (famille.photo) setPhoto(famille.photo);
        setSouscripteur({
          nom:           famille.principal     || "",
          dateNaissance: famille.dateNaissancePrincipal || "",
          lieuNaissance: famille.lieuNaissancePrincipal || "",
          telephone:     famille.telephone     || "",
          email:         famille.emailPrincipal || "",
          adresse:       famille.adresse       || "",
          type:          famille.typePrincipal || "adulte",
        });
        setFormData({
          dateDebut:     famille.dateDebut     || "",
          dureeGarantie: famille.dureeGarantie || "1",
          echeanceAuto:  famille.echeanceAuto  ?? true,
        });
        setBeneficiaires(
          (famille.beneficiairesDetail || famille.beneficiaires || []).map((b: any) =>
            typeof b === "string"
              ? { nom: b.replace(/ \(.+\)$/, ""), lien: (b.match(/\((.+)\)$/) || [])[1] || "", type: "adulte" as TypeAssure, dateNaissance: "", lieuNaissance: "", email: "", telephone: "" }
              : { dateNaissance: "", lieuNaissance: "", email: "", telephone: "", ...b }
          )
        );
      })
      .catch(() => toast.error("Erreur lors du chargement"));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      principal:               souscripteur.nom,
      dateNaissancePrincipal:  souscripteur.dateNaissance,
      lieuNaissancePrincipal:  souscripteur.lieuNaissance,
      telephone:               souscripteur.telephone,
      emailPrincipal:          souscripteur.email,
      adresse:                 souscripteur.adresse,
      typePrincipal:           souscripteur.type,
      photo:                   photo || undefined,
      beneficiaires:           beneficiaires.map(b => `${b.nom} (${b.lien})`),
      beneficiairesDetail:     beneficiaires,
      dateDebut:               formData.dateDebut,
      dureeGarantie:           formData.dureeGarantie,
      echeanceAuto:            formData.echeanceAuto,
      prime:                   totalEffectif.toString(),
      cp:                      cpEffectif.toString(),
      primeNette:              decompte.primeNette.toString(),
      taxes:                   decompte.taxes.toString(),
      tauxRemboursement,
      tarifPrimeEnfant:        tarifs.primeEnfant,
      tarifPrimeAdulte:        tarifs.primeAdulte,
      tarifPrimeAdulteAge:     tarifs.primeAdulteAge,
    };
    try {
      if (editingId) {
        await DataService.updateFamille(editingId, payload);
        toast.success("Famille modifiée avec succès");
      } else {
        await DataService.createFamille(payload);
        toast.success("Famille créée avec succès");
      }
      navigate("/maladie-famille");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  const totalPersonnes = 1 + beneficiaires.length;

  return (
    <AppLayout subHeader={
      <Button size="sm" onClick={() => navigate("/maladie-famille")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="max-w-3xl mx-auto space-y-6 pb-10">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-1">
            {editingId ? "Modifier la Famille" : "Nouvelle Famille"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Assurance Maladie Famille — CNART Assurances · Taux de remboursement : <strong>{tauxRemboursement > 0 ? `${tauxRemboursement} %` : "—"}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Souscripteur ─────────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Souscripteur (assuré principal)
              </h3>

              <div className="flex items-start gap-4">
                <PhotoUpload photo={photo} onChange={setPhoto} size="lg" rounded="full" label="Photo" />

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label>Nom complet *</Label>
                    <Input
                      required
                      value={souscripteur.nom}
                      onChange={e => setSouscripteur({ ...souscripteur, nom: e.target.value })}
                      placeholder="Alioune Badara Diene"
                    />
                  </div>
                  <div>
                    <Label>Date de naissance *</Label>
                    <Input
                      required
                      type="date"
                      value={souscripteur.dateNaissance}
                      onChange={e => {
                        const v = e.target.value;
                        setSouscripteur({ ...souscripteur, dateNaissance: v, type: typeFromDate(v) });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Lieu de naissance</Label>
                    <Input
                      value={souscripteur.lieuNaissance}
                      onChange={e => setSouscripteur({ ...souscripteur, lieuNaissance: e.target.value })}
                      placeholder="Dakar, Saint-Louis…"
                    />
                  </div>
                  <div>
                    <Label>Téléphone *</Label>
                    <Input
                      required
                      value={souscripteur.telephone}
                      onChange={e => setSouscripteur({ ...souscripteur, telephone: e.target.value })}
                      placeholder="+221 77 123 45 67"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={souscripteur.email}
                      onChange={e => setSouscripteur({ ...souscripteur, email: e.target.value })}
                      placeholder="nom@email.com"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Adresse</Label>
                    <Input
                      value={souscripteur.adresse}
                      onChange={e => setSouscripteur({ ...souscripteur, adresse: e.target.value })}
                      placeholder="Rue, Quartier, Ville"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Catégorie</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSouscripteur({ ...souscripteur, type: t })}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            souscripteur.type === t
                              ? TYPE_COLORS[t] + " ring-2 ring-offset-1 ring-current"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Bénéficiaires ────────────────────────────────────────── */}
            <section className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Bénéficiaires
                  <span className="text-sm text-muted-foreground font-normal">
                    ({beneficiaires.length} — {totalPersonnes} personne{totalPersonnes > 1 ? "s" : ""} au total)
                  </span>
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addBeneficiaire}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>

              {beneficiaires.map((ben, idx) => {
                const isOpen = expandedBen === idx;
                return (
                  <Card key={idx} className="border overflow-hidden">
                    {/* En-tête bénéficiaire */}
                    <div className="p-3 bg-gray-50 flex items-center gap-3">
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLORS[ben.type]}`}>
                        {ben.type === "enfant" ? "Enfant" : ben.type === "adulte" ? "Adulte" : "Âgé"}
                      </div>
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <Input
                          required
                          placeholder="Nom complet *"
                          value={ben.nom}
                          onChange={e => updateBen(idx, "nom", e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Input
                          required
                          placeholder="Lien (Épouse, Fils…) *"
                          value={ben.lien}
                          onChange={e => updateBen(idx, "lien", e.target.value)}
                          className="h-8 text-sm"
                        />
                        <Input
                          type="date"
                          placeholder="Date de naissance"
                          value={ben.dateNaissance}
                          onChange={e => updateBen(idx, "dateNaissance", e.target.value)}
                          className="h-8 text-sm"
                          title="Date de naissance (auto-catégorise)"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedBen(isOpen ? null : idx)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
                        >
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Détails
                        </button>
                        {beneficiaires.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBeneficiaire(idx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Détails étendus */}
                    {isOpen && (
                      <div className="p-4 border-t space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Lieu de naissance</Label>
                            <Input
                              value={ben.lieuNaissance}
                              onChange={e => updateBen(idx, "lieuNaissance", e.target.value)}
                              placeholder="Dakar, Thiès…"
                              className="h-8 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Téléphone</Label>
                            <Input
                              value={ben.telephone}
                              onChange={e => updateBen(idx, "telephone", e.target.value)}
                              placeholder="+221 77 000 00 00"
                              className="h-8 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Email</Label>
                            <Input
                              type="email"
                              value={ben.email}
                              onChange={e => updateBen(idx, "email", e.target.value)}
                              placeholder="email@exemple.com"
                              className="h-8 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Catégorie</Label>
                            <div className="grid grid-cols-3 gap-1 mt-1">
                              {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => updateBen(idx, "type", t)}
                                  className={`px-2 py-1.5 rounded border text-[10px] font-medium transition-all ${
                                    ben.type === t
                                      ? TYPE_COLORS[t] + " ring-1 ring-current ring-offset-1"
                                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  {t === "enfant" ? "Enfant" : t === "adulte" ? "Adulte" : "Âgé"}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </section>

            {/* ── Durée & Échéance ─────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2">Durée & Échéance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Durée de la garantie</Label>
                  <Select value={formData.dureeGarantie} onValueChange={v => setFormData({ ...formData, dureeGarantie: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DUREES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date de début</Label>
                  <Input required type="date" value={formData.dateDebut} onChange={e => setFormData({ ...formData, dateDebut: e.target.value })} />
                </div>
                <div>
                  <Label>Date d'échéance (calculée)</Label>
                  <Input readOnly value={dateFin} className="bg-gray-50 text-muted-foreground cursor-not-allowed" placeholder="—" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, echeanceAuto: !formData.echeanceAuto })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.echeanceAuto ? "bg-blue-600" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.echeanceAuto ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600" /> Renouvellement automatique à l'échéance
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.echeanceAuto
                      ? "Réajustement de prime effectué dans les 3 mois suivant l'échéance selon rapport S/P."
                      : "Un rappel sera envoyé avant l'expiration."}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Tarification ─────────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2">
                Tarification
                <span className="text-xs font-normal text-muted-foreground ml-2">— saisie par l'administrateur</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Prime Enfant <span className="text-muted-foreground">({"<"} 21 ans)</span></Label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Input
                      type="number" min={0} step={1000}
                      value={tarifs.primeEnfant === 0 ? "" : tarifs.primeEnfant}
                      onChange={e => setTarifs(t => ({ ...t, primeEnfant: e.target.value === "" ? 0 : Number(e.target.value) }))}
                      placeholder="0"
                      className="text-right font-mono text-sm"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">FCFA</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Prime Adulte <span className="text-muted-foreground">(21–59 ans)</span></Label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Input
                      type="number" min={0} step={1000}
                      value={tarifs.primeAdulte === 0 ? "" : tarifs.primeAdulte}
                      onChange={e => setTarifs(t => ({ ...t, primeAdulte: e.target.value === "" ? 0 : Number(e.target.value) }))}
                      placeholder="0"
                      className="text-right font-mono text-sm"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">FCFA</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Prime Âgée <span className="text-muted-foreground">(60 ans et +)</span></Label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Input
                      type="number" min={0} step={1000}
                      value={tarifs.primeAdulteAge === 0 ? "" : tarifs.primeAdulteAge}
                      onChange={e => setTarifs(t => ({ ...t, primeAdulteAge: e.target.value === "" ? 0 : Number(e.target.value) }))}
                      placeholder="0"
                      className="text-right font-mono text-sm"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">FCFA</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Taux de remboursement</Label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Input
                      type="number" min={0} max={100} step={1}
                      value={tauxRemboursement === 0 ? "" : tauxRemboursement}
                      onChange={e => setTauxRemboursement(e.target.value === "" ? 0 : Number(e.target.value))}
                      placeholder="0"
                      className="text-right font-mono text-sm"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">%</span>
                  </div>
                </div>
              </div>

              {/* Calcul direct : part remboursée par personne/an */}
              {tauxRemboursement > 0 && (tarifs.primeEnfant > 0 || tarifs.primeAdulte > 0 || tarifs.primeAdulteAge > 0) && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 grid grid-cols-3 gap-3 text-xs">
                  {[
                    { label: "Enfant", prime: tarifs.primeEnfant },
                    { label: "Adulte", prime: tarifs.primeAdulte },
                    { label: "Âgé",   prime: tarifs.primeAdulteAge },
                  ].map(({ label, prime }) => (
                    <div key={label} className="text-center">
                      <p className="font-semibold text-green-800">{label}</p>
                      <p className="font-mono font-bold text-green-700 text-sm mt-0.5">
                        {prime > 0 ? Math.round(prime * tauxRemboursement / 100).toLocaleString("fr-FR") + " FCFA" : "—"}
                      </p>
                      <p className="text-green-600 mt-0.5">remboursé / pers. / an</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Décompte de la prime ─────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Décompte de la prime</h3>

              <div className="grid grid-cols-3 gap-3 text-sm">
                {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
                  <div key={t} className={`p-3 rounded-lg border ${TYPE_COLORS[t]}`}>
                    <p className="text-xs opacity-80">{t === "enfant" ? "Enfant(s)" : t === "adulte" ? "Adulte(s)" : "Âgé(s)"}</p>
                    <p className="font-bold text-lg">{decompte.nb[t]}</p>
                    <p className="text-[10px] opacity-70">
                    {t === "enfant" ? tarifs.primeEnfant : t === "adulte" ? tarifs.primeAdulte : tarifs.primeAdulteAge}
                    {" "}FCFA/pers
                  </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border overflow-hidden text-sm">
                <div className="bg-gray-50 px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Décompte annuel × {formData.dureeGarantie} an{+formData.dureeGarantie > 1 ? "s" : ""}
                </div>
                {/* Lignes population */}
                {[
                  { label: `Enfants (${tarifs.primeEnfant.toLocaleString("fr-FR")} × ${decompte.nb.enfant})`,                value: decompte.primeEnfants,    show: decompte.nb.enfant > 0 },
                  { label: `Adultes (${tarifs.primeAdulte.toLocaleString("fr-FR")} × ${decompte.nb.adulte})`,                value: decompte.primeAdultes,    show: decompte.nb.adulte > 0 },
                  { label: `Personnes âgées (${tarifs.primeAdulteAge.toLocaleString("fr-FR")} × ${decompte.nb.adulte_age})`, value: decompte.primeAdultesAge, show: decompte.nb.adulte_age > 0 },
                  { label: "Prime nette (= Population)", value: decompte.primeNette, show: true, bold: true },
                ].filter(r => r.show).map((row, i) => (
                  <div key={i} className={`flex justify-between items-center px-4 py-2.5 border-t ${(row as any).bold ? "bg-blue-50 font-semibold" : ""}`}>
                    <span className="text-sm">{row.label}</span>
                    <span className={`font-mono text-sm ${(row as any).bold ? "text-blue-700" : ""}`}>
                      {(row.value * Number(formData.dureeGarantie)).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                ))}

                {/* CP — saisie manuelle (%) */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">CP — Chargements Professionnels</span>
                    <span className="text-[11px] text-muted-foreground">
                      Montant : {(cpEffectif * Number(formData.dureeGarantie)).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={cpManuel}
                      onChange={e => setCpManuel(e.target.value)}
                      placeholder={String(decompte.tauxCP)}
                      className="w-24 text-right font-mono text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <span className="text-sm font-semibold text-muted-foreground">%</span>
                    {cpManuel !== "" && (
                      <button type="button" onClick={() => setCpManuel("")}
                        className="text-gray-400 hover:text-gray-600" title="Réinitialiser">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Taxes */}
                <div className="flex justify-between items-center px-4 py-2.5 border-t">
                  <span className="text-sm">Taxes ({decompte.tauxTaxe.toFixed(1)} %)</span>
                  <span className="font-mono text-sm">{(decompte.taxes * Number(formData.dureeGarantie)).toLocaleString("fr-FR")} FCFA</span>
                </div>

                <div className="flex justify-between items-center px-4 py-3 border-t bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <span className="font-bold text-base">TOTAL À PAYER</span>
                  <span className="font-bold text-xl font-mono">
                    {(totalEffectif * Number(formData.dureeGarantie)).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </div>
            </section>

            {/* ── Garanties ────────────────────────────────────────────── */}
            <section>
              <button type="button" onClick={() => setShowGaranties(!showGaranties)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-sm">Tableau des garanties — Prise en charge au Sénégal</span>
                {showGaranties ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showGaranties && (
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-blue-700 text-white">
                      <th className="text-left p-3">Nature des actes</th>
                      <th className="p-3 text-center w-20">Taux</th>
                      <th className="text-left p-3">Plafond</th>
                    </tr></thead>
                    <tbody>
                      {GARANTIES_CNART.map((row, i) => (
                        <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="p-3"><p className="font-semibold text-xs text-blue-700">{row.categorie}</p><p className="text-xs text-muted-foreground mt-0.5">{row.actes}</p></td>
                          <td className="p-3 text-center font-bold text-green-700">{row.taux}</td>
                          <td className="p-3 text-xs text-muted-foreground">{row.plafond}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── Réajustement S/P ─────────────────────────────────────── */}
            <section>
              <button type="button" onClick={() => setShowReajust(!showReajust)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-sm">Réajustement de la prime — Rapport S/P</span>
                {showReajust ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showReajust && (
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <div className="p-3 bg-amber-50 border-b text-xs text-amber-800">
                    Dans les 3 mois suivant l'échéance, un avenant de réajustement est établi selon le rapport S/P.
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-100">
                      <th className="text-left p-3">Rapport S/P</th>
                      <th className="text-left p-3">Ajustement</th>
                    </tr></thead>
                    <tbody>
                      {REAJUSTEMENT_SP.map((row, i) => (
                        <tr key={i} className={`border-t ${row.ajustement.includes("réduction") ? "bg-green-50" : row.ajustement === "Aucune modification" ? "bg-gray-50" : "bg-red-50"}`}>
                          <td className="p-3 font-mono text-xs">{row.rapport}</td>
                          <td className={`p-3 text-xs font-semibold ${row.ajustement.includes("réduction") ? "text-green-700" : row.ajustement === "Aucune modification" ? "text-gray-600" : "text-red-700"}`}>{row.ajustement}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <Button type="submit" className="w-full py-6 text-base">
              {editingId ? "Modifier la famille" : "Créer la famille"}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
