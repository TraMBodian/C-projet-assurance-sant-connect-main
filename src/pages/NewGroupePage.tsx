import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, RefreshCw, ChevronDown, ChevronUp,
  Upload, Download, X, FileSpreadsheet, AlertCircle,
  Users, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { DataService } from "@/services/dataService";
import * as XLSX from "xlsx";
import {
  GARANTIES_CNART, REAJUSTEMENT_SP,
  PRIME_ENFANT, PRIME_ADULTE, PRIME_ADULTE_AGE,
  ACCESSOIRES, TAUX_TAXE,
  type TypeAssure, typeFromDate,
  TYPE_COLORS, TYPE_LABELS, TYPE_PRICES,
} from "./NewFamillePage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MembrePopulation {
  numero:        number;
  nom:           string;
  dateNaissance: string;
  sexe:          string;
  pieceIdentite: string;
  lien:          string;
  dateAdhesion:  string;
  salaire?:      string;
  garantie:      string;
  type:          TypeAssure;  // auto-calculé depuis dateNaissance
}

// ─── Calcul décompte ──────────────────────────────────────────────────────────

export function calcDecomptePopulation(membres: MembrePopulation[]) {
  const nb: Record<TypeAssure, number> = { enfant: 0, adulte: 0, adulte_age: 0 };
  for (const m of membres) nb[m.type]++;
  const primeEnfants    = nb.enfant     * PRIME_ENFANT;
  const primeAdultes    = nb.adulte     * PRIME_ADULTE;
  const primeAdultesAge = nb.adulte_age * PRIME_ADULTE_AGE;
  const primeNette      = primeEnfants + primeAdultes + primeAdultesAge;
  const taxes           = Math.round(primeNette * TAUX_TAXE);
  const total           = primeNette + ACCESSOIRES + taxes;
  return { nb, primeEnfants, primeAdultes, primeAdultesAge, primeNette, accessoires: ACCESSOIRES, taxes, total };
}

// ─── Colonnes du modèle Excel ─────────────────────────────────────────────────

const TEMPLATE_HEADERS = [
  "N°",
  "Nom et Prénom",
  "Date de naissance",
  "Sexe",
  "N° pièce d'identité",
  "Lien avec l'adhérent principal",
  "Date d'adhésion",
  "Salaire (optionnel)",
  "Garantie",
];

// ─── Télécharger le modèle ────────────────────────────────────────────────────

function downloadTemplate() {
  const example = [
    1, "Mamadou Diallo", "1985-03-12", "M", "SN-1234567890",
    "Adhérent principal", "2024-01-01", "500000", "Standard",
  ];
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, example]);
  ws["!cols"] = [
    { wch: 5 }, { wch: 25 }, { wch: 18 }, { wch: 8 },
    { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Population");
  XLSX.writeFile(wb, "modele_population_groupe.xlsx");
}

// ─── Parser le fichier Excel ──────────────────────────────────────────────────

function parseExcel(file: File): Promise<MembrePopulation[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: "array", cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (rows.length < 2) {
          reject(new Error("Le fichier ne contient pas de données")); return;
        }

        // Détecter si la première ligne est bien un en-tête (non numérique)
        const startRow = (typeof rows[0]?.[0] === "number" || rows[0]?.[0] == null) ? 0 : 1;

        const membres: MembrePopulation[] = [];
        for (let i = startRow; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;  // ignorer lignes vides
          const nom = String(row[1] ?? "").trim();
          if (!nom) continue;

          // Normaliser la date de naissance
          let dateNaissance = "";
          const rawDate = row[2];
          if (rawDate instanceof Date) {
            // Utiliser les méthodes locales pour éviter le décalage UTC
            const y = rawDate.getFullYear();
            const m = String(rawDate.getMonth() + 1).padStart(2, "0");
            const d = String(rawDate.getDate()).padStart(2, "0");
            dateNaissance = `${y}-${m}-${d}`;
          } else if (typeof rawDate === "string" && rawDate.trim()) {
            const s = rawDate.trim().replace(/\//g, "-");
            const parts = s.split("-");
            if (parts.length === 3 && parts[0].length <= 2) {
              // dd-mm-yyyy → yyyy-mm-dd
              dateNaissance = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            } else {
              dateNaissance = s;
            }
          } else if (typeof rawDate === "number") {
            // Numéro série Excel → date JS (25569 = écart jours entre 1900-01-01 et 1970-01-01)
            const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            const y = jsDate.getUTCFullYear();
            const m = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
            const d = String(jsDate.getUTCDate()).padStart(2, "0");
            dateNaissance = `${y}-${m}-${d}`;
          }

          membres.push({
            numero:        Number(row[0]) || i,
            nom,
            dateNaissance,
            sexe:          String(row[3] || "").trim(),
            pieceIdentite: String(row[4] || "").trim(),
            lien:          String(row[5] || "").trim(),
            dateAdhesion:  String(row[6] || "").trim(),
            salaire:       row[7] ? String(row[7]) : undefined,
            garantie:      String(row[8] || "Standard").trim(),
            type:          typeFromDate(dateNaissance),
          });
        }
        resolve(membres);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

const DUREES = ["1", "2", "3"].map(v => ({ value: v, label: `${v} an${+v > 1 ? "s" : ""}` }));

// ─── Composant ────────────────────────────────────────────────────────────────

export default function NewGroupePage() {
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId,     setEditingId]     = useState<number | null>(null);
  const [showGaranties, setShowGaranties] = useState(false);
  const [showReajust,   setShowReajust]   = useState(false);
  const [isDragging,    setIsDragging]    = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [fileName,      setFileName]      = useState<string>("");

  const [formData, setFormData] = useState({
    entreprise:    "",
    secteur:       "",
    dateDebut:     "",
    dureeGarantie: "1",
    echeanceAuto:  true,
  });
  const [membres, setMembres] = useState<MembrePopulation[]>([]);

  // Date de fin calculée
  const dateFin = useMemo(() => {
    if (!formData.dateDebut) return "";
    const d = new Date(formData.dateDebut);
    d.setFullYear(d.getFullYear() + Number(formData.dureeGarantie));
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("fr-FR");
  }, [formData.dateDebut, formData.dureeGarantie]);

  const decompte = useMemo(() => calcDecomptePopulation(membres), [membres]);
  const duree    = Number(formData.dureeGarantie);

  // ── Charger un groupe existant ──
  useEffect(() => {
    const idParam = Number(searchParams.get("id"));
    if (!idParam) return;
    setEditingId(idParam);
    DataService.getGroupeById(idParam)
      .then((groupe) => {
        if (!groupe) return;
        setFormData({
          entreprise:    groupe.entreprise    || "",
          secteur:       groupe.secteur       || "",
          dateDebut:     groupe.debut         || "",
          dureeGarantie: groupe.dureeGarantie || "1",
          echeanceAuto:  groupe.echeanceAuto  ?? true,
        });
        if (groupe.membresDetail?.length) {
          setMembres(groupe.membresDetail);
          setFileName("population_chargée.xlsx");
        }
      })
      .catch(() => toast.error("Erreur lors du chargement"));
  }, [searchParams]);

  // ── Gestion du fichier ──
  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Veuillez importer un fichier Excel (.xlsx ou .xls)");
      return;
    }
    setIsLoading(true);
    try {
      const parsed = await parseExcel(file);
      if (parsed.length === 0) {
        toast.error("Aucune donnée trouvée dans le fichier");
      } else {
        setMembres(parsed);
        setFileName(file.name);
        toast.success(`${parsed.length} membre${parsed.length > 1 ? "s" : ""} importé${parsed.length > 1 ? "s" : ""} avec succès`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la lecture du fichier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";  // reset so same file can be re-selected
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const removeMembre = (idx: number) =>
    setMembres(prev => prev.filter((_, i) => i !== idx));

  // ── Soumission ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (membres.length === 0) {
      toast.error("Veuillez importer la liste des membres via Excel");
      return;
    }
    const payload = {
      entreprise:    formData.entreprise,
      secteur:       formData.secteur,
      employes:      membres.length,
      assures:       membres.length,
      debut:         formData.dateDebut,
      dureeGarantie: formData.dureeGarantie,
      echeanceAuto:  formData.echeanceAuto,
      prime:         (decompte.total * duree).toString(),
      primeNette:    (decompte.primeNette * duree).toString(),
      taxes:         (decompte.taxes * duree).toString(),
      membresDetail: membres,
    };
    try {
      if (editingId) {
        await DataService.updateGroupe(editingId, payload);
        toast.success("Groupe modifié avec succès");
      } else {
        await DataService.createGroupe(payload);
        toast.success("Groupe créé avec succès");
      }
      navigate("/maladie-groupe");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <Button variant="ghost" onClick={() => navigate("/maladie-groupe")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-1">
            {editingId ? "Modifier le Groupe" : "Nouveau Groupe"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Assurance Maladie Groupe — CNART Assurances · Taux de remboursement : <strong>80 %</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ── Entreprise ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2">Entreprise</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nom de l'entreprise *</Label>
                  <Input
                    required
                    value={formData.entreprise}
                    onChange={e => setFormData({ ...formData, entreprise: e.target.value })}
                    placeholder="Sonatel SA"
                  />
                </div>
                <div>
                  <Label>Secteur d'activité *</Label>
                  <Input
                    required
                    value={formData.secteur}
                    onChange={e => setFormData({ ...formData, secteur: e.target.value })}
                    placeholder="Télécommunications, Finance…"
                  />
                </div>
              </div>
            </section>

            {/* ── Durée & Échéance ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2">Durée & Échéance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Durée de la garantie</Label>
                  <Select
                    value={formData.dureeGarantie}
                    onValueChange={v => setFormData({ ...formData, dureeGarantie: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DUREES.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date de début *</Label>
                  <Input
                    required
                    type="date"
                    value={formData.dateDebut}
                    onChange={e => setFormData({ ...formData, dateDebut: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date d'échéance (calculée)</Label>
                  <Input
                    readOnly
                    value={dateFin}
                    className="bg-gray-50 text-muted-foreground cursor-not-allowed"
                    placeholder="—"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, echeanceAuto: !formData.echeanceAuto })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.echeanceAuto ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.echeanceAuto ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    Renouvellement automatique à l'échéance
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.echeanceAuto
                      ? "Réajustement S/P dans les 3 mois suivant l'échéance."
                      : "Un rappel sera envoyé avant l'expiration."}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Import Excel ── */}
            <section className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Population à assurer
                  {membres.length > 0 && (
                    <span className="text-sm text-muted-foreground font-normal">
                      ({membres.length} membre{membres.length > 1 ? "s" : ""})
                    </span>
                  )}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le modèle
                </Button>
              </div>

              {/* Explication */}
              <div className="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Comment procéder ?</p>
                  <ol className="mt-1 space-y-0.5 text-xs list-decimal list-inside text-blue-700">
                    <li>Téléchargez le modèle Excel ci-dessus</li>
                    <li>Remplissez-le avec la liste des assurés fournie par l'entreprise</li>
                    <li>Importez le fichier complété ci-dessous</li>
                  </ol>
                  <p className="mt-1 text-xs text-blue-600">
                    Colonnes : N° · Nom et Prénom · Date de naissance · Sexe · N° pièce d'identité · Lien avec l'adhérent principal · Date d'adhésion · Salaire (optionnel) · Garantie
                  </p>
                </div>
              </div>

              {/* Zone de dépôt */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : membres.length > 0
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2 text-blue-600">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Lecture du fichier…</p>
                  </div>
                ) : membres.length > 0 ? (
                  <div className="flex flex-col items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                    <p className="text-sm font-semibold">{fileName}</p>
                    <p className="text-xs text-green-600">
                      {membres.length} membre{membres.length > 1 ? "s" : ""} importé{membres.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Cliquer pour remplacer le fichier</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <FileSpreadsheet className="w-10 h-10 text-gray-400" />
                    <p className="text-sm font-semibold">Glisser-déposer votre fichier Excel ici</p>
                    <p className="text-xs text-muted-foreground">ou cliquer pour sélectionner</p>
                    <p className="text-xs text-muted-foreground mt-1">Formats acceptés : .xlsx, .xls</p>
                  </div>
                )}
              </div>

              {/* Tableau de la population importée */}
              {membres.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 flex justify-between items-center border-b">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Liste des membres ({membres.length})
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { setMembres([]); setFileName(""); }}
                    >
                      <X className="w-3 h-3 mr-1" /> Effacer tout
                    </Button>
                  </div>
                  <div className="overflow-x-auto max-h-72 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white border-b z-10">
                        <tr>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium w-8">N°</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[160px]">Nom et Prénom</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium w-28">Date naiss.</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium w-12">Sexe</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[120px]">Pièce d'identité</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[140px]">Lien</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium w-24">Catégorie</th>
                          <th className="text-left px-3 py-2 text-muted-foreground font-medium w-24">Garantie</th>
                          <th className="w-8 px-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {membres.map((m, idx) => (
                          <tr key={idx} className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                            <td className="px-3 py-2 text-muted-foreground">{m.numero}</td>
                            <td className="px-3 py-2 font-medium">{m.nom}</td>
                            <td className="px-3 py-2 text-muted-foreground">{m.dateNaissance || "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{m.sexe || "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{m.pieceIdentite || "—"}</td>
                            <td className="px-3 py-2 text-muted-foreground">{m.lien || "—"}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLORS[m.type]}`}>
                                {m.type === "enfant" ? "Enfant" : m.type === "adulte" ? "Adulte" : "Âgé"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{m.garantie}</td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => removeMembre(idx)}
                                className="p-0.5 text-red-400 hover:text-red-600 rounded"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* ── Décompte ── */}
            {membres.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-semibold text-base border-b pb-2">Décompte de la prime</h3>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
                    <div key={t} className={`p-3 rounded-lg border ${TYPE_COLORS[t]}`}>
                      <p className="text-xs opacity-80">
                        {t === "enfant" ? "Enfant(s)" : t === "adulte" ? "Adulte(s)" : "Âgé(s)"}
                      </p>
                      <p className="font-bold text-lg">{decompte.nb[t]}</p>
                      <p className="text-[10px] opacity-70">{TYPE_PRICES[t].toLocaleString("fr-FR")} FCFA/pers</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border overflow-hidden text-sm">
                  <div className="bg-gray-50 px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                    Décompte annuel × {duree} an{duree > 1 ? "s" : ""}
                  </div>
                  {[
                    { label: `Enfants (${PRIME_ENFANT.toLocaleString()} × ${decompte.nb.enfant})`,             value: decompte.primeEnfants,    show: decompte.nb.enfant > 0 },
                    { label: `Adultes (${PRIME_ADULTE.toLocaleString()} × ${decompte.nb.adulte})`,             value: decompte.primeAdultes,    show: decompte.nb.adulte > 0 },
                    { label: `Personnes âgées (${PRIME_ADULTE_AGE.toLocaleString()} × ${decompte.nb.adulte_age})`, value: decompte.primeAdultesAge, show: decompte.nb.adulte_age > 0 },
                    { label: "Prime nette totale", value: decompte.primeNette,  show: true, bold: true },
                    { label: "Accessoires",         value: decompte.accessoires, show: true },
                    { label: `Taxes (${(TAUX_TAXE * 100).toFixed(1)} %)`, value: decompte.taxes, show: true },
                  ].filter(r => r.show).map((row, i) => (
                    <div key={i} className={`flex justify-between items-center px-4 py-2.5 border-t ${(row as any).bold ? "bg-blue-50 font-semibold" : ""}`}>
                      <span className="text-sm">{row.label}</span>
                      <span className={`font-mono text-sm ${(row as any).bold ? "text-blue-700" : ""}`}>
                        {(row.value * duree).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 border-t bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <span className="font-bold text-base">TOTAL À PAYER</span>
                    <span className="font-bold text-xl font-mono">
                      {(decompte.total * duree).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* ── Tableau des garanties ── */}
            <section>
              <button
                type="button"
                onClick={() => setShowGaranties(!showGaranties)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-sm">Tableau des garanties — Prise en charge au Sénégal</span>
                {showGaranties ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showGaranties && (
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-700 text-white">
                        <th className="text-left p-3 font-semibold">Nature des actes</th>
                        <th className="p-3 text-center font-semibold w-24">Taux</th>
                        <th className="text-left p-3 font-semibold">Plafond de remboursement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GARANTIES_CNART.map((row, i) => (
                        <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="p-3">
                            <p className="font-semibold text-xs text-blue-700">{row.categorie}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{row.actes}</p>
                          </td>
                          <td className="p-3 text-center font-bold text-green-700">{row.taux}</td>
                          <td className="p-3 text-xs text-muted-foreground">{row.plafond}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── Réajustement S/P ── */}
            <section>
              <button
                type="button"
                onClick={() => setShowReajust(!showReajust)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-sm">Réajustement de la prime — Rapport S/P</span>
                {showReajust ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showReajust && (
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <div className="p-3 bg-amber-50 border-b text-xs text-amber-800">
                    Dans les 3 mois suivant l'échéance, un avenant de réajustement est établi en fonction du rapport S/P.
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3 font-semibold">Rapport S/P</th>
                        <th className="text-left p-3 font-semibold">Ajustement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REAJUSTEMENT_SP.map((row, i) => (
                        <tr key={i} className={`border-t ${
                          row.ajustement.includes("réduction") ? "bg-green-50"
                          : row.ajustement === "Aucune modification" ? "bg-gray-50"
                          : "bg-red-50"
                        }`}>
                          <td className="p-3 font-mono text-xs">{row.rapport}</td>
                          <td className={`p-3 text-xs font-semibold ${
                            row.ajustement.includes("réduction") ? "text-green-700"
                            : row.ajustement === "Aucune modification" ? "text-gray-600"
                            : "text-red-700"
                          }`}>{row.ajustement}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <Button
              type="submit"
              className="w-full py-6 text-base"
              disabled={membres.length === 0}
            >
              {editingId ? "Modifier le groupe" : "Créer le groupe"}
              {membres.length > 0 && ` (${membres.length} membre${membres.length > 1 ? "s" : ""})`}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
