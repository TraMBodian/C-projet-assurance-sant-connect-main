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
  Download, X, FileSpreadsheet, AlertCircle,
  Users, CheckCircle2, AlertTriangle, XCircle,
  UserCheck, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { DataService } from "@/services/dataService";
import * as XLSX from "xlsx";
import {
  GARANTIES_CNART, REAJUSTEMENT_SP,
  PRIME_ENFANT, PRIME_ADULTE, PRIME_ADULTE_AGE,
  ACCESSOIRES, TAUX_TAXE,
  type TypeAssure, typeFromDate,
  TYPE_COLORS, TYPE_PRICES,
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
  type:          TypeAssure;
}

export interface ValidationError {
  ligne:   number;
  nom:     string;
  champ:   string;
  message: string;
}

export interface ParseResult {
  membres: MembrePopulation[];
  errors:  ValidationError[];
}

export interface FamilleGroup {
  principal:   MembrePopulation | null;
  ayantsDroit: MembrePopulation[];
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

// ─── Regroupement familles ────────────────────────────────────────────────────

export function groupByPrincipal(membres: MembrePopulation[]): FamilleGroup[] {
  const groups: FamilleGroup[] = [];
  let current: FamilleGroup | null = null;
  for (const m of membres) {
    if (m.lien === "Principal") {
      if (current) groups.push(current);
      current = { principal: m, ayantsDroit: [] };
    } else {
      if (!current) current = { principal: null, ayantsDroit: [] };
      current.ayantsDroit.push(m);
    }
  }
  if (current) groups.push(current);
  return groups;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const LIENS_AUTORISES    = ["Principal", "Conjoint", "Enfant", "Père", "Mère", "Frère", "Sœur", "Autre"];
const GARANTIES_AUTORISEES = ["Standard", "Confort", "Premium"];

// ─── Template Excel ───────────────────────────────────────────────────────────

function downloadTemplate() {
  const headers = [
    "N°", "Nom et Prénom *", "Date de naissance *", "Sexe *",
    "N° pièce d'identité *", "Lien avec l'adhérent principal *",
    "Date d'adhésion", "Salaire (optionnel)", "Garantie",
  ];
  const exemples = [
    [1, "Mamadou Diallo",  "1980-05-15", "M", "1234567890123", "Principal", "2024-01-01", "750000",  "Standard"],
    [2, "Fatou Diallo",    "1985-08-22", "F", "9876543210987", "Conjoint",  "2024-01-01", "",        "Standard"],
    [3, "Ibrahima Diallo", "2010-03-10", "M", "1111222233334", "Enfant",    "2024-01-01", "",        "Standard"],
    [4, "Aïssatou Diallo", "2015-11-30", "F", "5555666677778", "Enfant",    "2024-01-01", "",        "Standard"],
    [5, "Ousmane Sow",     "1975-12-01", "M", "2222333344445", "Principal", "2024-01-01", "900000",  "Confort"],
    [6, "Mariama Sow",     "1978-06-18", "F", "3333444455556", "Conjoint",  "2024-01-01", "",        "Confort"],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...exemples]);
  ws["!cols"] = [
    { wch: 5 }, { wch: 28 }, { wch: 20 }, { wch: 10 },
    { wch: 22 }, { wch: 32 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Population");
  XLSX.writeFile(wb, "modele_population_groupe.xlsx");
}

// ─── Télécharger fichier d'erreurs ────────────────────────────────────────────

function downloadErrorFile(errors: ValidationError[], membres: MembrePopulation[]) {
  const rows = errors.map(e => ({
    "Ligne":  e.ligne,
    "Nom":    e.nom || "—",
    "Champ":  e.champ,
    "Erreur": e.message,
  }));
  const wsErrors = XLSX.utils.json_to_sheet(rows);
  wsErrors["!cols"] = [{ wch: 8 }, { wch: 25 }, { wch: 22 }, { wch: 40 }];
  const wsValid = XLSX.utils.json_to_sheet(membres.map(m => ({
    "N°":            m.numero,
    "Nom et Prénom": m.nom,
    "Date naissance":m.dateNaissance,
    "Sexe":          m.sexe,
    "Pièce identité":m.pieceIdentite,
    "Lien":          m.lien,
    "Date adhésion": m.dateAdhesion,
    "Salaire":       m.salaire || "",
    "Garantie":      m.garantie,
    "Catégorie":     m.type === "enfant" ? "Enfant" : m.type === "adulte" ? "Adulte" : "Âgé",
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsErrors, "Erreurs");
  XLSX.utils.book_append_sheet(wb, wsValid,  "Lignes valides");
  XLSX.writeFile(wb, "rapport_erreurs_import.xlsx");
}

// ─── Convertir date Excel → "yyyy-mm-dd" ─────────────────────────────────────

function toDateStr(rawDate: any): string {
  if (!rawDate && rawDate !== 0) return "";
  if (rawDate instanceof Date) {
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, "0");
    const d = String(rawDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof rawDate === "number") {
    const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    const m = String(jsDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(jsDate.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof rawDate === "string") {
    const s = rawDate.trim().replace(/\//g, "-");
    const parts = s.split("-");
    if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
    return s;
  }
  return "";
}

function isValidDate(d: string): boolean {
  if (!d || d.length < 8) return false;
  const dt = new Date(d);
  return !isNaN(dt.getTime()) && dt.getFullYear() > 1900 && dt.getFullYear() <= new Date().getFullYear();
}

function norm(s: any): string {
  return String(s ?? "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

// ─── Détection colonnes ───────────────────────────────────────────────────────

const COL_PATTERNS: Record<string, string[]> = {
  nom:           ["nom", "prenom", "name", "complet"],
  dateNaissance: ["naissance", "dob"],
  sexe:          ["sexe", "genre", "sex"],
  pieceIdentite: ["piece", "identite", "cni", "cin", "passeport"],
  lien:          ["lien", "parent", "adherent", "relation"],
  dateAdhesion:  ["adhesion"],
  salaire:       ["salaire", "salary", "revenu"],
  garantie:      ["garantie", "plan", "formule"],
};

function findKey(keys: string[], field: string): string | null {
  const patterns = COL_PATTERNS[field] ?? [field];
  for (const key of keys) {
    const n = norm(key);
    if (patterns.some(p => n.includes(p))) return key;
  }
  return null;
}

// ─── Parser + valider le fichier ─────────────────────────────────────────────

function parseAndValidate(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), { type: "array" });
        let ws: XLSX.WorkSheet | null = null;
        for (const name of wb.SheetNames) {
          if (name.toLowerCase().includes("instruction")) continue;
          const c = wb.Sheets[name];
          if (c && c["!ref"]) { ws = c; break; }
        }
        if (!ws) { reject(new Error("Fichier Excel vide ou illisible")); return; }

        const jsonRows = XLSX.utils.sheet_to_json(ws, {
          defval: "", blankrows: false, raw: true,
        }) as Record<string, any>[];

        if (jsonRows.length === 0) {
          reject(new Error("Aucune donnée trouvée. Le fichier est vide ou ne contient qu'un en-tête."));
          return;
        }

        const allKeys = Object.keys(jsonRows[0]);
        const k = {
          nom:           findKey(allKeys, "nom"),
          dateNaissance: findKey(allKeys, "dateNaissance"),
          sexe:          findKey(allKeys, "sexe"),
          pieceIdentite: findKey(allKeys, "pieceIdentite"),
          lien:          findKey(allKeys, "lien"),
          dateAdhesion:  findKey(allKeys, "dateAdhesion"),
          salaire:       findKey(allKeys, "salaire"),
          garantie:      findKey(allKeys, "garantie"),
        };

        const g = (row: Record<string, any>, key: string | null) =>
          key ? String(row[key] ?? "").trim() : "";

        const membres:  MembrePopulation[] = [];
        const errors:   ValidationError[]  = [];
        const cniSeen:  Set<string>        = new Set();

        // Détecter si les colonnes clés existent dans le fichier
        const hasColDate = k.dateNaissance !== null;
        const hasColSexe = k.sexe          !== null;

        jsonRows.forEach((row, i) => {
          const ligne = i + 2;
          const nom          = g(row, k.nom);
          const dateNaissRaw = k.dateNaissance ? row[k.dateNaissance] : "";
          const sexeRaw      = g(row, k.sexe);
          const cni          = g(row, k.pieceIdentite);
          const lienRaw      = g(row, k.lien);
          const dateAdhRaw   = k.dateAdhesion ? row[k.dateAdhesion] : "";
          const salaireRaw   = g(row, k.salaire);
          const garantieRaw  = g(row, k.garantie);

          // ── Seul le nom est bloquant ──────────────────────────────────────
          if (!nom) {
            errors.push({ ligne, nom: "", champ: "Nom et Prénom", message: "Champ obligatoire vide" });
            return;
          }

          // ── Date de naissance (avertissement si colonne présente mais vide/invalide) ──
          const dateNaissance = toDateStr(dateNaissRaw);
          if (hasColDate && !dateNaissance) {
            errors.push({ ligne, nom, champ: "Date de naissance", message: "Vide — catégorie définie sur Adulte par défaut" });
          } else if (hasColDate && dateNaissance && !isValidDate(dateNaissance)) {
            errors.push({ ligne, nom, champ: "Date de naissance", message: `Format non reconnu : "${String(dateNaissRaw).trim()}" — utilisez AAAA-MM-JJ` });
          }

          // ── Sexe (avertissement si colonne présente mais valeur invalide) ──
          const sexeNorm = norm(sexeRaw);
          let sexe = sexeNorm.startsWith("f") ? "F"
                   : sexeNorm.startsWith("m") || sexeNorm.startsWith("h") ? "M"
                   : sexeRaw.toUpperCase();
          if (hasColSexe && sexeRaw && !["M", "F"].includes(sexe)) {
            errors.push({ ligne, nom, champ: "Sexe", message: `Valeur non reconnue : "${sexeRaw}" — utilisez M ou F` });
            sexe = "";
          }

          // ── N° pièce d'identité (doublon = avertissement, absent = ignoré) ──
          let cniVal = cni;
          if (cni) {
            if (cniSeen.has(cni)) {
              errors.push({ ligne, nom, champ: "N° pièce d'identité", message: `Doublon détecté : "${cni}" — ligne ignorée` });
              return; // doublon réel = on skip
            }
            cniSeen.add(cni);
          }
          // Si pas de colonne CNI ou valeur vide → générer un identifiant interne
          if (!cniVal) cniVal = "";

          // ── Lien (défaut "Autre" si absent) ──────────────────────────────
          const lienNorm = norm(lienRaw);
          let lien = LIENS_AUTORISES.find(l => norm(l) === lienNorm)
                  ?? LIENS_AUTORISES.find(l => lienNorm.includes(norm(l)))
                  ?? (lienRaw || "");
          if (!lien) lien = "Autre";

          // ── Date d'adhésion ───────────────────────────────────────────────
          const dateAdhesion = toDateStr(dateAdhRaw);

          // ── Garantie ──────────────────────────────────────────────────────
          const garantieNorm = norm(garantieRaw);
          const garantie = GARANTIES_AUTORISEES.find(g => norm(g) === garantieNorm)
                        ?? (garantieRaw || "Standard");

          const dn = isValidDate(dateNaissance) ? dateNaissance : "";
          membres.push({
            numero:        membres.length + 1,
            nom,
            dateNaissance: dn,
            sexe:          sexe || "",
            pieceIdentite: cniVal,
            lien,
            dateAdhesion:  dateAdhesion || "",
            salaire:       salaireRaw || undefined,
            garantie,
            type:          typeFromDate(dn),
          });
        });

        if (membres.length === 0 && errors.length === 0) {
          reject(new Error(`Aucun membre trouvé. Colonnes lues : ${allKeys.join(", ")}`));
          return;
        }
        resolve({ membres, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

const DUREES = ["1", "2", "3"].map(v => ({ value: v, label: `${v} an${+v > 1 ? "s" : ""}` }));

// ─── Sous-composant : ligne tableau membres ───────────────────────────────────

function MembreRow({
  m, isPrincipal, isAyantDroit, onRemove,
}: {
  m: MembrePopulation;
  isPrincipal?: boolean;
  isAyantDroit?: boolean;
  onRemove?: () => void;
}) {
  return (
    <tr className={`border-t transition-colors ${isPrincipal ? "bg-blue-50/40 hover:bg-blue-50/60" : "bg-white hover:bg-gray-50/60"}`}>
      {/* N° + icône */}
      <td className="px-4 py-2.5 w-14">
        <span className={`flex items-center gap-1.5 ${isPrincipal ? "text-blue-600" : "text-gray-400"}`}>
          {isPrincipal
            ? <UserCheck className="w-3.5 h-3.5 shrink-0" />
            : <UserPlus  className="w-3.5 h-3.5 shrink-0" />
          }
          <span className="text-xs font-mono">{m.numero}</span>
        </span>
      </td>

      {/* Nom */}
      <td className={`px-3 py-2.5 text-sm font-medium min-w-[160px] ${isPrincipal ? "text-blue-700" : "text-gray-800"}`}>
        {m.nom}
      </td>

      {/* Date naissance */}
      <td className="px-3 py-2.5 text-sm text-gray-500 w-28 font-mono">
        {m.dateNaissance || "—"}
      </td>

      {/* Sexe */}
      <td className="px-3 py-2.5 text-sm text-gray-600 w-14 text-center">
        {m.sexe || "—"}
      </td>

      {/* Pièce d'identité */}
      <td className="px-3 py-2.5 text-sm text-gray-500 font-mono min-w-[120px]">
        {m.pieceIdentite || "—"}
      </td>

      {/* Lien */}
      <td className="px-3 py-2.5 w-28">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${
          m.lien === "Principal"
            ? "bg-blue-100 text-blue-700 border-blue-200"
            : "bg-white text-gray-700 border-gray-300"
        }`}>
          {m.lien || "—"}
        </span>
      </td>

      {/* Catégorie */}
      <td className="px-3 py-2.5 w-24">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
          m.type === "enfant"
            ? "bg-green-100 text-green-700 border-green-200"
            : m.type === "adulte_age"
            ? "bg-purple-100 text-purple-700 border-purple-200"
            : "bg-blue-50 text-blue-600 border-blue-200"
        }`}>
          {m.type === "enfant" ? "Enfant" : m.type === "adulte" ? "Adulte" : "Âgé"}
        </span>
      </td>

      {/* Supprimer */}
      {onRemove && (
        <td className="px-3 py-2.5 w-8">
          <button type="button" onClick={onRemove}
            className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function NewGroupePage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef   = useRef<HTMLInputElement>(null);

  const [editingId,        setEditingId]        = useState<number | null>(null);
  const [showGaranties,    setShowGaranties]    = useState(false);
  const [showReajust,      setShowReajust]      = useState(false);
  const [isDragging,       setIsDragging]       = useState(false);
  const [isLoading,        setIsLoading]        = useState(false);
  const [fileName,         setFileName]         = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showErrors,       setShowErrors]       = useState(false);

  const [formData, setFormData] = useState({
    entreprise:    "",
    secteur:       "",
    dateDebut:     "",
    dureeGarantie: "1",
    echeanceAuto:  true,
  });
  const [membres, setMembres] = useState<MembrePopulation[]>([]);

  const dateFin = useMemo(() => {
    if (!formData.dateDebut) return "";
    const d = new Date(formData.dateDebut);
    d.setFullYear(d.getFullYear() + Number(formData.dureeGarantie));
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("fr-FR");
  }, [formData.dateDebut, formData.dureeGarantie]);

  const decompte     = useMemo(() => calcDecomptePopulation(membres), [membres]);
  const duree        = Number(formData.dureeGarantie);
  const familleGroups = useMemo(() => groupByPrincipal(membres), [membres]);

  // ── Charger groupe existant ──
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
        let detail = groupe.employesDetail;
        if (typeof detail === "string") {
          try { detail = JSON.parse(detail); } catch { detail = []; }
        }
        if (Array.isArray(detail) && detail.length > 0) {
          setMembres(detail);
          setFileName("population_chargée.xlsx");
        }
      })
      .catch(() => toast.error("Erreur lors du chargement"));
  }, [searchParams]);

  // ── Gestion fichier — import direct sans prévisualisation ──
  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Veuillez importer un fichier Excel (.xlsx ou .xls)");
      return;
    }
    setIsLoading(true);
    setValidationErrors([]);
    try {
      const result = await parseAndValidate(file);
      setMembres(result.membres);
      setFileName(file.name);
      setValidationErrors(result.errors);
      if (result.errors.length > 0) setShowErrors(true);

      if (result.errors.length === 0) {
        toast.success(`${result.membres.length} membre${result.membres.length > 1 ? "s" : ""} importé${result.membres.length > 1 ? "s" : ""} · ${groupByPrincipal(result.membres).length} famille${groupByPrincipal(result.membres).length > 1 ? "s" : ""} détectée${groupByPrincipal(result.membres).length > 1 ? "s" : ""}`);
      } else if (result.membres.length === 0) {
        toast.error(`${result.errors.length} erreur${result.errors.length > 1 ? "s" : ""} bloquante${result.errors.length > 1 ? "s" : ""} — corrigez le fichier`);
      } else {
        toast.warning(`${result.membres.length} membre${result.membres.length > 1 ? "s" : ""} importé${result.membres.length > 1 ? "s" : ""} · ${result.errors.length} ligne${result.errors.length > 1 ? "s" : ""} ignorée${result.errors.length > 1 ? "s" : ""}`);
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
    e.target.value = "";
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
      toast.error("Veuillez importer la liste des membres");
      return;
    }
    const payload = {
      entreprise:     formData.entreprise,
      secteur:        formData.secteur,
      employes:       membres.length,
      assures:        membres.length,
      debut:          formData.dateDebut,
      dureeGarantie:  formData.dureeGarantie,
      echeanceAuto:   formData.echeanceAuto,
      prime:          (decompte.total * duree).toString(),
      primeNette:     (decompte.primeNette * duree).toString(),
      taxes:          (decompte.taxes * duree).toString(),
      employesDetail: membres,
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

  const hasErrors   = validationErrors.length > 0;
  const hasWarnings = hasErrors && membres.length > 0;

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
                  <Input required value={formData.entreprise}
                    onChange={e => setFormData({ ...formData, entreprise: e.target.value })}
                    placeholder="Sonatel SA" />
                </div>
                <div>
                  <Label>Secteur d'activité *</Label>
                  <Input required value={formData.secteur}
                    onChange={e => setFormData({ ...formData, secteur: e.target.value })}
                    placeholder="Télécommunications, Finance…" />
                </div>
              </div>
            </section>

            {/* ── Durée & Échéance ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-base border-b pb-2">Durée & Échéance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Durée de la garantie</Label>
                  <Select value={formData.dureeGarantie}
                    onValueChange={v => setFormData({ ...formData, dureeGarantie: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DUREES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date de début *</Label>
                  <Input required type="date" value={formData.dateDebut}
                    onChange={e => setFormData({ ...formData, dateDebut: e.target.value })} />
                </div>
                <div>
                  <Label>Date d'échéance (calculée)</Label>
                  <Input readOnly value={dateFin}
                    className="bg-gray-50 text-muted-foreground cursor-not-allowed" placeholder="—" />
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
                      ({membres.length} membre{membres.length > 1 ? "s" : ""} · {familleGroups.length} famille{familleGroups.length > 1 ? "s" : ""})
                    </span>
                  )}
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                  <Download className="w-4 h-4" /> Télécharger le modèle
                </Button>
              </div>

              {/* Instructions */}
              <div className="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Comment procéder ?</p>
                  <ol className="mt-1 space-y-0.5 text-xs list-decimal list-inside text-blue-700">
                    <li>Téléchargez le modèle Excel (bouton ci-dessus)</li>
                    <li>Remplissez-le : une ligne par personne, groupées par famille</li>
                    <li>Importez le fichier — les membres sont ajoutés automatiquement</li>
                  </ol>
                  <div className="mt-2 text-xs text-blue-600 space-y-0.5">
                    <p><strong>Seul le nom est obligatoire</strong> — les autres colonnes (date de naissance, sexe, CNI, lien) sont facultatives</p>
                    <p><strong>Liens acceptés :</strong> {LIENS_AUTORISES.join(" · ")} — "Autre" par défaut si absent</p>
                    <p><strong>Colonnes reconnues automatiquement</strong> quelle que soit la langue ou la mise en forme du fichier</p>
                  </div>
                </div>
              </div>

              {/* Zone de dépôt */}
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileInput} className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging ? "border-blue-500 bg-blue-50"
                  : hasErrors && membres.length === 0 ? "border-red-400 bg-red-50"
                  : hasWarnings ? "border-amber-400 bg-amber-50"
                  : membres.length > 0 ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2 text-blue-600">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Lecture et validation du fichier…</p>
                  </div>
                ) : hasErrors && membres.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 text-red-700">
                    <XCircle className="w-10 h-10 text-red-500" />
                    <p className="text-sm font-semibold">{fileName}</p>
                    <p className="text-xs text-red-600">{validationErrors.length} erreur{validationErrors.length > 1 ? "s" : ""} bloquante{validationErrors.length > 1 ? "s" : ""} — aucun membre importé</p>
                    <p className="text-xs text-muted-foreground mt-1">Cliquer pour importer un autre fichier</p>
                  </div>
                ) : hasWarnings ? (
                  <div className="flex flex-col items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-10 h-10 text-amber-500" />
                    <p className="text-sm font-semibold">{fileName}</p>
                    <p className="text-xs text-amber-700">
                      {membres.length} membre{membres.length > 1 ? "s" : ""} importé{membres.length > 1 ? "s" : ""}
                      {" · "}{validationErrors.length} erreur{validationErrors.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Cliquer pour remplacer le fichier</p>
                  </div>
                ) : membres.length > 0 ? (
                  <div className="flex flex-col items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                    <p className="text-sm font-semibold">{fileName}</p>
                    <p className="text-xs text-green-600">
                      {membres.length} membre{membres.length > 1 ? "s" : ""} · {familleGroups.length} famille{familleGroups.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Cliquer pour remplacer le fichier</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <FileSpreadsheet className="w-10 h-10 text-gray-400" />
                    <p className="text-sm font-semibold">Glisser-déposer votre fichier Excel ici</p>
                    <p className="text-xs text-muted-foreground">ou cliquer pour sélectionner · .xlsx, .xls</p>
                  </div>
                )}
              </div>

              {/* ── Panneau erreurs ── */}
              {validationErrors.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                  <div
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                      membres.length === 0 ? "bg-red-50 border-b border-red-200" : "bg-amber-50 border-b border-amber-200"
                    }`}
                    onClick={() => setShowErrors(v => !v)}
                  >
                    <div className="flex items-center gap-2">
                      {membres.length === 0
                        ? <XCircle className="w-4 h-4 text-red-600" />
                        : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      <span className={`text-sm font-semibold ${membres.length === 0 ? "text-red-800" : "text-amber-800"}`}>
                        {validationErrors.length} erreur{validationErrors.length > 1 ? "s" : ""} détectée{validationErrors.length > 1 ? "s" : ""}
                        {membres.length > 0 ? ` — ${membres.length} ligne${membres.length > 1 ? "s" : ""} valide${membres.length > 1 ? "s" : ""}` : " — aucun membre importé"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); downloadErrorFile(validationErrors, membres); }}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        <Download className="w-3 h-3" /> Rapport Excel
                      </button>
                      {showErrors ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </div>
                  </div>
                  {showErrors && (
                    <div className="overflow-x-auto max-h-56 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-3 py-2 text-muted-foreground font-medium w-16">Ligne</th>
                            <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[140px]">Nom</th>
                            <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[140px]">Champ</th>
                            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Erreur</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationErrors.map((err, idx) => (
                            <tr key={idx} className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                              <td className="px-3 py-2 font-mono text-red-600 font-semibold">L.{err.ligne}</td>
                              <td className="px-3 py-2 font-medium">{err.nom || "—"}</td>
                              <td className="px-3 py-2 text-muted-foreground">{err.champ}</td>
                              <td className="px-3 py-2 text-red-700">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tableau membres (vue groupée) */}
              {membres.length > 0 && (
                <div className="rounded-xl border overflow-hidden">
                  {/* En-tête */}
                  <div className="px-4 py-3 flex justify-between items-center border-b bg-white">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Membres confirmés ({membres.length}) · {familleGroups.length} famille{familleGroups.length > 1 ? "s" : ""}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setMembres([]); setFileName(""); setValidationErrors([]); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Effacer tout
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 border-b z-10">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-gray-500 font-medium w-14">N°</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium min-w-[160px]">Nom et Prénom</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-28">Date naiss.</th>
                          <th className="text-center px-3 py-2.5 text-gray-500 font-medium w-14">Sexe</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium min-w-[120px]">Pièce d'identité</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-28">Lien</th>
                          <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-24">Catégorie</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {familleGroups.map((fg, fi) => (
                          <>
                            {fi > 0 && (
                              <tr key={`sep-${fi}`}>
                                <td colSpan={8} className="border-t-2 border-blue-100 py-0 bg-blue-50/20" />
                              </tr>
                            )}
                            {fg.principal && (
                              <MembreRow
                                key={`p-${fg.principal.numero}`}
                                m={fg.principal}
                                isPrincipal
                                onRemove={() => removeMembre(membres.indexOf(fg.principal!))}
                              />
                            )}
                            {fg.ayantsDroit.map((ad) => (
                              <MembreRow
                                key={`ad-${ad.numero}`}
                                m={ad}
                                isAyantDroit
                                onRemove={() => removeMembre(membres.indexOf(ad))}
                              />
                            ))}
                          </>
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
                      <p className="text-xs opacity-80">{t === "enfant" ? "Enfant(s)" : t === "adulte" ? "Adulte(s)" : "Âgé(s)"}</p>
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

            {/* ── Garanties ── */}
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
                      <th className="text-left p-3 font-semibold">Nature des actes</th>
                      <th className="p-3 text-center font-semibold w-24">Taux</th>
                      <th className="text-left p-3 font-semibold">Plafond</th>
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

            {/* ── Réajustement S/P ── */}
            <section>
              <button type="button" onClick={() => setShowReajust(!showReajust)}
                className="w-full flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="font-semibold text-sm">Réajustement de la prime — Rapport S/P</span>
                {showReajust ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showReajust && (
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <div className="p-3 bg-amber-50 border-b text-xs text-amber-800">
                    Dans les 3 mois suivant l'échéance, un avenant de réajustement est établi en fonction du rapport S/P.
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-100">
                      <th className="text-left p-3 font-semibold">Rapport S/P</th>
                      <th className="text-left p-3 font-semibold">Ajustement</th>
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

            <Button type="submit" className="w-full py-6 text-base" disabled={membres.length === 0}>
              {editingId
                ? `Modifier le groupe${membres.length > 0 ? ` (${membres.length} membres)` : ""}`
                : `Créer le groupe${membres.length > 0 ? ` (${membres.length} membres)` : ""}`
              }
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
