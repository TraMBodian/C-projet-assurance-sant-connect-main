import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, RefreshCw, ChevronDown, ChevronUp, User, Users, Globe } from "@/components/ui/Icons";
import { toast } from "sonner";
import { DataService } from "@/services/dataService";
import { getTarifs, TARIF_DEFAULTS, type TarifSettings } from "@/services/tarifService";
import { notificationStore } from "@/services/notificationStore";
import { LogoUpload } from "@/components/PhotoUpload";
import {
  type TypeAssure, type Beneficiaire,
  TYPE_LABELS, TYPE_COLORS,
  typeFromDate, newBeneficiaire, calcDecompte,
  getGarantiesCNART, REAJUSTEMENT_SP, DUREES,
} from "./types";

interface Props {
  questAnswers: Record<string, string>;
  onBack:       () => void;
}

export default function FamilleFormStep({ questAnswers, onBack }: Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [editingId,       setEditingId]       = useState<number | null>(null);
  const [showGaranties,   setShowGaranties]   = useState(false);
  const [showReajust,     setShowReajust]     = useState(false);
  const [showConditions,  setShowConditions]  = useState(false);
  const [expandedBen,     setExpandedBen]     = useState<number | null>(null);
  const [photo,           setPhoto]           = useState<string>("");
  const [cpManuel,        setCpManuel]        = useState<string>("");
  const [tauxRemboursement, setTauxRemboursement] = useState<number>(0);

  const [souscripteur, setSouscripteur] = useState({
    nom: "", dateNaissance: "", lieuNaissance: "",
    telephone: "", email: "", adresse: "",
    type: "adulte" as TypeAssure,
  });

  const [formData, setFormData] = useState({
    dateDebut: "", dureeGarantie: "1", echeanceAuto: true,
  });

  const [beneficiaires, setBeneficiaires] = useState<Beneficiaire[]>([newBeneficiaire()]);

  const [tarifs, setTarifs] = useState<TarifSettings>(getTarifs);

  const [territorialite, setTerritorialite] = useState({
    senegal: "", afrique: "", resteMonde: "",
  });

  // Chargement en mode édition
  useEffect(() => {
    const idParam = Number(searchParams.get("id"));
    if (!idParam) return;
    setEditingId(idParam);
    DataService.getFamilleById(idParam)
      .then((famille) => {
        if (!famille) return;
        if (famille.photo) setPhoto(famille.photo);
        setSouscripteur({
          nom:           famille.principal              || "",
          dateNaissance: famille.dateNaissancePrincipal || "",
          lieuNaissance: famille.lieuNaissancePrincipal || "",
          telephone:     famille.telephone              || "",
          email:         famille.emailPrincipal         || "",
          adresse:       famille.adresse                || "",
          type:          famille.typePrincipal          || "adulte",
        });
        setFormData({
          dateDebut:     famille.dateDebut     || "",
          dureeGarantie: famille.dureeGarantie || "1",
          echeanceAuto:  famille.echeanceAuto  ?? true,
        });
        // beneficiairesDetail peut arriver comme tableau ou comme string JSON sérialisée
        const isValidBenef = (b: any) =>
          b !== null && typeof b === "object" && !Array.isArray(b)
          && typeof b.nom === "string" && b.nom.trim() !== "";

        let detailArr: any[] = [];
        const rawDetail = famille.beneficiairesDetail;
        if (Array.isArray(rawDetail)) {
          detailArr = rawDetail.filter(isValidBenef);
        } else if (typeof rawDetail === "string") {
          try {
            const p = JSON.parse(rawDetail);
            detailArr = Array.isArray(p) ? p.filter(isValidBenef) : [];
          } catch { detailArr = []; }
        }
        // Repli sur le champ beneficiaires (strings "Nom (Lien)") si aucun objet valide
        if (detailArr.length === 0 && Array.isArray(famille.beneficiaires)) {
          detailArr = famille.beneficiaires.filter(
            (b: any) => typeof b === "string" && b.trim() !== "" && !b.startsWith("undefined")
          );
        }
        setBeneficiaires(
          detailArr.map((b: any) =>
            typeof b === "string"
              ? { nom: b.replace(/ \(.+\)$/, ""), lien: (b.match(/\((.+)\)$/) || [])[1] || "", type: "adulte" as TypeAssure, dateNaissance: "", lieuNaissance: "", email: "", telephone: "" }
              : { dateNaissance: "", lieuNaissance: "", email: "", telephone: "", ...b }
          )
        );
      })
      .catch(() => toast.error("Erreur lors du chargement"));
  }, [searchParams]);

  // ─── Calculs ───────────────────────────────────────────────────────────────

  const dateFin = useMemo(() => {
    if (!formData.dateDebut) return "";
    const d = new Date(formData.dateDebut);
    d.setFullYear(d.getFullYear() + Number(formData.dureeGarantie));
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("fr-FR");
  }, [formData.dateDebut, formData.dureeGarantie]);

  const decompte     = useMemo(() => calcDecompte(beneficiaires, souscripteur.type, tarifs), [beneficiaires, souscripteur.type, tarifs]);
  const cpEffectif   = cpManuel !== "" && !isNaN(Number(cpManuel)) ? Number(cpManuel) : 0;
  const taxesEffectif = Math.round((decompte.primeNette + cpEffectif) * decompte.tauxTaxe / 100);
  const totalEffectif = decompte.primeNette + cpEffectif + taxesEffectif;
  const totalPersonnes = 1 + beneficiaires.length;

  // ─── Bénéficiaires ─────────────────────────────────────────────────────────

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
      if (field === "dateNaissance" && value) updated[i].type = typeFromDate(value);
      return updated;
    });
  };

  // ─── Soumission ────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      principal:                   souscripteur.nom,
      dateNaissancePrincipal:      souscripteur.dateNaissance,
      lieuNaissancePrincipal:      souscripteur.lieuNaissance,
      telephone:                   souscripteur.telephone,
      emailPrincipal:              souscripteur.email,
      adresse:                     souscripteur.adresse,
      typePrincipal:               souscripteur.type,
      photo:                       photo || undefined,
      questionnaireMedical:        editingId ? undefined : JSON.stringify(questAnswers),
      beneficiaires:               beneficiaires.map(b => `${b.nom} (${b.lien})`),
      beneficiairesDetail:         beneficiaires,
      dateDebut:                   formData.dateDebut,
      dureeGarantie:               formData.dureeGarantie,
      echeanceAuto:                formData.echeanceAuto,
      prime:                       totalEffectif.toString(),
      cp:                          cpEffectif.toString(),
      primeNette:                  decompte.primeNette.toString(),
      taxes:                       taxesEffectif.toString(),
      tauxRemboursement,
      tarifPrimeEnfant:            tarifs.primeEnfant,
      tarifPrimeAdulte:            tarifs.primeAdulte,
      tarifPrimeAdulteAge:         tarifs.primeAdulteAge,
      territorialite:              JSON.stringify(territorialite),
      plafondDentaire:             tarifs.plafondDentaire,
      plafondOptique:              tarifs.plafondOptique,
      plafondHospitalisationJour:  tarifs.plafondHospitalisationJour,
      plafondOrthophonie:          tarifs.plafondOrthophonie,
      plafondMaterniteSimple:      tarifs.plafondMaterniteSimple,
      plafondMaterniteGemellaire:  tarifs.plafondMaterniteGemellaire,
      plafondMaterniteChirurgical: tarifs.plafondMaterniteChirurgical,
      plafondTransport:            tarifs.plafondTransport,
    };
    try {
      if (editingId) {
        await DataService.updateFamille(editingId, payload);
        toast.success("Famille modifiée avec succès");
      } else {
        await DataService.createFamille(payload);
        notificationStore.notifyFamilleEnAttente({ nom: souscripteur.nom || "Nouveau souscripteur" });
        toast.success("Demande soumise — en attente de validation par l'administrateur");
      }
      navigate("/admin/maladie-famille");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  type PlafondEntry = { key: keyof TarifSettings; suffix: string };
  const PLAFOND_KEYS: Record<string, PlafondEntry> = {
    "Soins dentaires":            { key: "plafondDentaire",             suffix: "FCFA / bénéficiaire" },
    "Optique":                    { key: "plafondOptique",              suffix: "FCFA / bénéf. · 2 ans" },
    "Hospitalisation — Clinique": { key: "plafondHospitalisationJour",  suffix: "FCFA / jour" },
    "Orthophonie":                { key: "plafondOrthophonie",          suffix: "FCFA / bénéf. / an" },
    "Maternité — Simple":         { key: "plafondMaterniteSimple",      suffix: "FCFA / évènement" },
    "Maternité — Gémellaire":     { key: "plafondMaterniteGemellaire",  suffix: "FCFA / évènement" },
    "Maternité — Chirurgical":    { key: "plafondMaterniteChirurgical", suffix: "FCFA / évènement" },
    "Transport terrestre":        { key: "plafondTransport",            suffix: "FCFA / évènement" },
  };

  return (
    <AppLayout subHeader={
      <Button size="sm" onClick={() => navigate("/admin/maladie-famille")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="max-w-3xl mx-auto space-y-6 pb-10">

        {/* Titre */}
        {!editingId && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "#1B529918", border: "1px solid #1B529940", color: "#1B5299" }}
          >
            Nouvelle souscription — Maladie Famille
          </div>
        )}

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-1">
            {editingId ? "Modifier la Famille" : "Nouvelle Famille"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Assurance Maladie Famille — Papy Services Assurances · Taux de remboursement :{" "}
            <strong>{tauxRemboursement > 0 ? `${tauxRemboursement} %` : "—"}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Souscripteur ───────────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Souscripteur (assuré principal)
              </h3>
              <div className="flex items-start gap-4">
                <LogoUpload logo={photo} onChange={setPhoto} size={88} rounded label="Photo" />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Label>Nom complet *</Label>
                    <Input required value={souscripteur.nom}
                      onChange={e => setSouscripteur({ ...souscripteur, nom: e.target.value })}
                      placeholder="Alioune Badara Diene" />
                  </div>
                  <div>
                    <Label>Date de naissance *</Label>
                    <Input required type="date" value={souscripteur.dateNaissance}
                      onChange={e => {
                        const v = e.target.value;
                        setSouscripteur({ ...souscripteur, dateNaissance: v, type: typeFromDate(v) });
                      }} />
                  </div>
                  <div>
                    <Label>Lieu de naissance</Label>
                    <Input value={souscripteur.lieuNaissance}
                      onChange={e => setSouscripteur({ ...souscripteur, lieuNaissance: e.target.value })}
                      placeholder="Dakar, Saint-Louis…" />
                  </div>
                  <div>
                    <Label>Téléphone *</Label>
                    <Input required value={souscripteur.telephone}
                      onChange={e => setSouscripteur({ ...souscripteur, telephone: e.target.value })}
                      placeholder="+221 77 123 45 67" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={souscripteur.email}
                      onChange={e => setSouscripteur({ ...souscripteur, email: e.target.value })}
                      placeholder="nom@email.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Adresse</Label>
                    <Input value={souscripteur.adresse}
                      onChange={e => setSouscripteur({ ...souscripteur, adresse: e.target.value })}
                      placeholder="Rue, Quartier, Ville" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Catégorie</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
                        <button key={t} type="button"
                          onClick={() => setSouscripteur({ ...souscripteur, type: t })}
                          className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                            souscripteur.type === t
                              ? TYPE_COLORS[t] + " ring-2 ring-offset-1 ring-current"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}>
                          {TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Bénéficiaires ──────────────────────────────────────────── */}
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
                    <div className="p-3 bg-gray-50 flex items-center gap-3">
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLORS[ben.type]}`}>
                        {ben.type === "enfant" ? "Enfant" : ben.type === "adulte" ? "Adulte" : "Âgé"}
                      </div>
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <Input required placeholder="Nom complet *" value={ben.nom}
                          onChange={e => updateBen(idx, "nom", e.target.value)} className="h-8 text-sm" />
                        <Input required placeholder="Lien (Épouse, Fils…) *" value={ben.lien}
                          onChange={e => updateBen(idx, "lien", e.target.value)} className="h-8 text-sm" />
                        <Input type="date" placeholder="Date de naissance" value={ben.dateNaissance}
                          onChange={e => updateBen(idx, "dateNaissance", e.target.value)}
                          className="h-8 text-sm" title="Date de naissance (auto-catégorise)" />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => setExpandedBen(isOpen ? null : idx)}
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50">
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          Détails
                        </button>
                        {beneficiaires.length > 1 && (
                          <button type="button" onClick={() => removeBeneficiaire(idx)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="p-4 border-t space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Lieu de naissance</Label>
                            <Input value={ben.lieuNaissance}
                              onChange={e => updateBen(idx, "lieuNaissance", e.target.value)}
                              placeholder="Dakar, Thiès…" className="h-8 text-sm mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs">Téléphone</Label>
                            <Input value={ben.telephone}
                              onChange={e => updateBen(idx, "telephone", e.target.value)}
                              placeholder="+221 77 000 00 00" className="h-8 text-sm mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs">Email</Label>
                            <Input type="email" value={ben.email}
                              onChange={e => updateBen(idx, "email", e.target.value)}
                              placeholder="email@exemple.com" className="h-8 text-sm mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs">Catégorie</Label>
                            <div className="grid grid-cols-3 gap-1 mt-1">
                              {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
                                <button key={t} type="button" onClick={() => updateBen(idx, "type", t)}
                                  className={`px-2 py-1.5 rounded border text-[10px] font-medium transition-all ${
                                    ben.type === t
                                      ? TYPE_COLORS[t] + " ring-1 ring-current ring-offset-1"
                                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                  }`}>
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

            {/* ── Durée & Échéance ───────────────────────────────────────── */}
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
                  <Input required type="date" value={formData.dateDebut}
                    onChange={e => setFormData({ ...formData, dateDebut: e.target.value })} />
                </div>
                <div>
                  <Label>Date d'échéance (calculée)</Label>
                  <Input readOnly value={dateFin} className="bg-gray-50 text-muted-foreground cursor-not-allowed" placeholder="—" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                <button type="button"
                  onClick={() => setFormData({ ...formData, echeanceAuto: !formData.echeanceAuto })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.echeanceAuto ? "bg-blue-600" : "bg-gray-300"}`}>
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

            {/* ── Tarification ───────────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2">
                Tarification
                <span className="text-xs font-normal text-muted-foreground ml-2">— saisie par l'administrateur</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {([
                  { label: "Prime Enfant",  sub: "< 21 ans",    key: "primeEnfant"   },
                  { label: "Prime Adulte",  sub: "21–59 ans",   key: "primeAdulte"   },
                  { label: "Prime Âgée",    sub: "60 ans et +", key: "primeAdulteAge"},
                ] as const).map(({ label, sub, key }) => (
                  <div key={key}>
                    <Label className="text-xs">{label} <span className="text-muted-foreground">({sub})</span></Label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input type="number" min={0} step={1000}
                        value={tarifs[key] === 0 ? "" : tarifs[key]}
                        onChange={e => setTarifs(t => ({ ...t, [key]: e.target.value === "" ? 0 : Number(e.target.value) }))}
                        placeholder="0" className="text-right font-mono text-sm" />
                      <span className="text-xs text-muted-foreground shrink-0">FCFA</span>
                    </div>
                  </div>
                ))}
                <div>
                  <Label className="text-xs">Taux de remboursement</Label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Input type="number" min={0} max={100} step={1}
                      value={tauxRemboursement === 0 ? "" : tauxRemboursement}
                      onChange={e => setTauxRemboursement(e.target.value === "" ? 0 : Number(e.target.value))}
                      placeholder="0" className="text-right font-mono text-sm" />
                    <span className="text-xs text-muted-foreground shrink-0">%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Territorialité ─────────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-600" /> Territorialité
              </h3>
              <p className="text-xs text-muted-foreground -mt-2">Taux de prise en charge selon la zone géographique des soins.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                  { key: "senegal",    label: "Sénégal",        bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700"  },
                  { key: "afrique",    label: "Afrique",        bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700"   },
                  { key: "resteMonde", label: "Reste du monde", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
                ] as const).map(({ key, label, bg, border, text }) => (
                  <div key={key} className={`p-4 rounded-lg border ${border} ${bg}`}>
                    <Label className={`${text} font-semibold text-sm`}>{label}</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input type="number" min={0} max={100} step={1}
                        value={territorialite[key]}
                        onChange={e => setTerritorialite(t => ({ ...t, [key]: e.target.value }))}
                        placeholder="0" className="text-right font-mono" />
                      <span className="text-sm font-semibold text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Décompte de la prime ───────────────────────────────────── */}
            <section className="space-y-3">
              <h3 className="font-semibold text-base border-b pb-2">Décompte de la prime</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
                  <div key={t} className={`p-3 rounded-lg border ${TYPE_COLORS[t]}`}>
                    <p className="text-xs opacity-80">{t === "enfant" ? "Enfant(s)" : t === "adulte" ? "Adulte(s)" : "Âgé(s)"}</p>
                    <p className="font-bold text-lg">{decompte.nb[t]}</p>
                    <p className="text-[10px] opacity-70">
                      {t === "enfant" ? tarifs.primeEnfant : t === "adulte" ? tarifs.primeAdulte : tarifs.primeAdulteAge} FCFA/pers
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border overflow-hidden text-sm">
                <div className="bg-gray-50 px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Décompte annuel × {formData.dureeGarantie} an{+formData.dureeGarantie > 1 ? "s" : ""}
                </div>
                {[
                  { label: `Enfants (${tarifs.primeEnfant.toLocaleString("fr-FR")} × ${decompte.nb.enfant})`,                value: decompte.primeEnfants,    show: decompte.nb.enfant > 0 },
                  { label: `Adultes (${tarifs.primeAdulte.toLocaleString("fr-FR")} × ${decompte.nb.adulte})`,                value: decompte.primeAdultes,    show: decompte.nb.adulte > 0 },
                  { label: `Personnes âgées (${tarifs.primeAdulteAge.toLocaleString("fr-FR")} × ${decompte.nb.adulte_age})`, value: decompte.primeAdultesAge, show: decompte.nb.adulte_age > 0 },
                  { label: "Prime Nette (Population)", value: decompte.primeNette, show: true, bold: true },
                ].filter(r => r.show).map((row, i) => (
                  <div key={i} className={`flex justify-between items-center px-4 py-2.5 border-t ${(row as any).bold ? "bg-blue-50 font-semibold" : ""}`}>
                    <span className="text-sm">{row.label}</span>
                    <span className={`font-mono text-sm ${(row as any).bold ? "text-blue-700" : ""}`}>
                      {(row.value * Number(formData.dureeGarantie)).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-2.5 border-t gap-4">
                  <span className="text-sm font-medium">Coût de police</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <input type="number" min={0} step={500} value={cpManuel}
                      onChange={e => setCpManuel(e.target.value)} placeholder="0"
                      className="w-36 text-right font-mono text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    <span className="text-sm font-semibold text-muted-foreground shrink-0">FCFA</span>
                    {cpManuel !== "" && (
                      <button type="button" onClick={() => setCpManuel("")}
                        className="text-gray-400 hover:text-gray-600" title="Réinitialiser">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center px-4 py-2.5 border-t">
                  <span className="text-sm">Taxes (10 %)</span>
                  <span className="font-mono text-sm">{(taxesEffectif * Number(formData.dureeGarantie)).toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 border-t text-white" style={{ background: "#1B5299" }}>
                  <span className="font-bold text-base">TOTAL À PAYER</span>
                  <span className="font-bold text-xl font-mono">
                    {(totalEffectif * Number(formData.dureeGarantie)).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              </div>
            </section>

            {/* ── Garanties ──────────────────────────────────────────────── */}
            <section>
              <button type="button" onClick={() => setShowGaranties(!showGaranties)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-sm">Tableau des garanties & plafonds — Prise en charge au Sénégal</span>
                {showGaranties ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showGaranties && (
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-blue-700 text-white">
                      <th className="text-left p-3">Nature des actes</th>
                      <th className="p-3 text-center w-28">Taux de remboursement</th>
                      <th className="text-left p-3">Plafond <span className="font-normal text-blue-200 text-xs">(saisable)</span></th>
                    </tr></thead>
                    <tbody>
                      {getGarantiesCNART(tarifs, tauxRemboursement > 0 ? tauxRemboursement : undefined).map((row, i) => {
                        const plafondInfo = PLAFOND_KEYS[row.categorie];
                        return (
                          <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                            <td className="p-3"><p className="font-semibold text-xs text-blue-700">{row.categorie}</p><p className="text-xs text-muted-foreground mt-0.5">{row.actes}</p></td>
                            <td className="p-3 text-center font-bold text-green-700">{row.taux}</td>
                            <td className="p-3">
                              {plafondInfo ? (
                                <div className="flex items-center gap-2">
                                  <input type="number" min={0} step={5000}
                                    value={(tarifs[plafondInfo.key] as number) === 0 ? "" : (tarifs[plafondInfo.key] as number)}
                                    onChange={e => setTarifs(t => ({ ...t, [plafondInfo.key]: e.target.value === "" ? 0 : Number(e.target.value) }))}
                                    placeholder="0"
                                    className="w-28 text-right font-mono text-xs border rounded px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">{plafondInfo.suffix}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">{row.plafond}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── Conditions de souscription ─────────────────────────────── */}
            <section>
              <button type="button" onClick={() => setShowConditions(!showConditions)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-sm">Conditions de souscription</span>
                {showConditions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showConditions && (
                <div className="mt-2 rounded-lg border overflow-hidden text-sm">
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="font-bold text-blue-700 uppercase text-xs tracking-wider mb-2">I. Conditions d'adhésion</p>
                      <ul className="space-y-1 text-gray-700">
                        <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Souscripteur âgé de 18 à 65 ans révolus à la date d'effet du contrat.</li>
                        <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Bénéficiaires : conjoint(e), enfants à charge (0–21 ans ; 25 ans si études) ; ascendants à charge de moins de 65 ans.</li>
                        <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Résidence habituelle au Sénégal ou dans la zone de territorialité du contrat.</li>
                        <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Déclaration sincère et complète de l'état de santé de chaque bénéficiaire.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-blue-700 uppercase text-xs tracking-wider mb-2">II. Documents requis</p>
                      <ul className="space-y-1 text-gray-700">
                        <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Formulaire de souscription dûment complété et signé.</li>
                        <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Pièce d'identité valide du souscripteur (CNI, passeport ou titre de séjour).</li>
                        <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Acte de mariage (pour le conjoint) et actes de naissance des enfants.</li>
                        <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Questionnaire médical pour les personnes de 50 ans et plus.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-amber-700 uppercase text-xs tracking-wider mb-2">III. Délais de carence</p>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-amber-50 border-b"><th className="text-left p-2.5 font-semibold">Type de prestation</th><th className="p-2.5 font-semibold text-right">Délai</th></tr></thead>
                          <tbody>
                            {[
                              { type: "Soins courants (hors accidents)", delai: "1 mois" },
                              { type: "Soins dentaires",                 delai: "3 mois" },
                              { type: "Optique",                         delai: "6 mois" },
                              { type: "Maternité",                       delai: "9 mois" },
                              { type: "Accidents corporels",             delai: "Aucun"  },
                            ].map((r, i) => (
                              <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                                <td className="p-2.5">{r.type}</td>
                                <td className={`p-2.5 text-right font-semibold ${r.delai === "Aucun" ? "text-green-600" : "text-amber-700"}`}>{r.delai}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-red-700 uppercase text-xs tracking-wider mb-2">IV. Principales exclusions</p>
                      <ul className="space-y-1 text-gray-700">
                        <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Affections et maladies préexistantes à la date d'adhésion.</li>
                        <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Chirurgie esthétique non consécutive à un accident.</li>
                        <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Traitements expérimentaux non reconnus par les autorités sanitaires.</li>
                        <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Hospitalisations résultant de conflits armés ou catastrophes naturelles.</li>
                        <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Soins à l'étranger hors options Afrique ou Reste du Monde souscrites.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ── Réajustement S/P ───────────────────────────────────────── */}
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
