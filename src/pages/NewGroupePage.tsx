import { useState, useEffect, useMemo, useRef, Fragment } from "react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, RefreshCw, ChevronDown, ChevronUp, ChevronRight,
  ChevronLeft, Download, X, FileSpreadsheet, AlertCircle,
  Users, CheckCircle2, AlertTriangle, XCircle, Search,
  UserCheck, UserPlus, Eye, Save, Clock, Loader2, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { DataService } from "@/services/dataService";
import * as XLSX from "xlsx";
import {
  GARANTIES_CNART, REAJUSTEMENT_SP,
  type TypeAssure, typeFromDate,
  TYPE_COLORS,
} from "./NewFamillePage";
import { getTarifs, type TarifSettings } from "@/services/tarifService";
import { LogoUpload } from "@/components/PhotoUpload";

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

export function calcDecomptePopulation(membres: MembrePopulation[], tarifs?: TarifSettings) {
  const t = tarifs ?? getTarifs();
  const nb: Record<TypeAssure, number> = { enfant: 0, adulte: 0, adulte_age: 0 };
  for (const m of membres) nb[m.type]++;
  const primeEnfants    = nb.enfant     * t.primeEnfant;
  const primeAdultes    = nb.adulte     * t.primeAdulte;
  const primeAdultesAge = nb.adulte_age * t.primeAdulteAge;
  const primeNette      = primeEnfants + primeAdultes + primeAdultesAge;
  const cp              = Math.round(primeNette * t.tauxCP   / 100);
  const taxes           = Math.round(primeNette * t.tauxTaxe / 100);
  const total           = primeNette + cp + taxes;
  return { nb, primeEnfants, primeAdultes, primeAdultesAge, primeNette, cp, tauxCP: t.tauxCP, taxes, tauxTaxe: t.tauxTaxe, total };
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

function toDateStr(rawDate: string | number | Date | null | undefined): string {
  if (!rawDate && rawDate !== 0) return "";
  if (rawDate instanceof Date) {
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth() + 1).padStart(2, "0");
    const d = String(rawDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof rawDate === "number") {
    if (rawDate <= 0) return ""; // cellule vide ou date Excel invalide
    const jsDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
    const y = jsDate.getUTCFullYear();
    if (y <= 1900) return ""; // protection contre les serials aberrants
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
  nom:           ["nom", "prenom", "noms", "prenoms", "name", "complet", "appellation", "identite complete"],
  dateNaissance: ["naissance", "dob", "ne le", "nee le", "date nais", "date de nais", "nee", "ne", "ddn", "birth"],
  sexe:          ["sexe", "genre", "sex", "gender", "civilite"],
  pieceIdentite: ["piece", "identite", "cni", "cin", "passeport", "matricule", "numero piece", "n piece", "carte"],
  lien:          ["lien", "juridique", "parent", "adherent", "relation", "qualite", "statut", "fonction", "categorie"],
  dateAdhesion:  ["adhesion", "entree", "affiliation", "inscription", "debut"],
  salaire:       ["salaire", "salary", "revenu", "remuneration", "traitement"],
  garantie:      ["garantie", "plan", "formule", "niveau", "couverture"],
};

// Aliases pour normaliser les valeurs du champ "lien"
const LIEN_ALIASES: Record<string, string> = {
  "assure":        "Principal",
  "assures":       "Principal",
  "employe":       "Principal",
  "employes":      "Principal",
  "salarie":       "Principal",
  "salaries":      "Principal",
  "souscripteur":  "Principal",
  "titulaire":     "Principal",
  "principal":     "Principal",
  "adherent":      "Principal",
  "chef":          "Principal",
  "epoux":         "Conjoint",
  "epouse":        "Conjoint",
  "conjoint":      "Conjoint",
  "conjointe":     "Conjoint",
  "mari":          "Conjoint",
  "femme":         "Conjoint",
  "enfant":        "Enfant",
  "fils":          "Enfant",
  "fille":         "Enfant",
  "enfants":       "Enfant",
  "pere":          "Père",
  "papa":          "Père",
  "mere":          "Mère",
  "maman":         "Mère",
  "frere":         "Frère",
  "soeur":         "Sœur",
};

function normalizeLien(raw: string): string {
  const n = norm(raw);
  if (!n) return "Principal"; // si lien absent, premier de chaque groupe = Principal
  // Correspondance exacte en premier
  for (const [alias, val] of Object.entries(LIEN_ALIASES)) {
    if (n === alias) return val;
  }
  // Correspondance partielle
  for (const [alias, val] of Object.entries(LIEN_ALIASES)) {
    if (n.includes(alias)) return val;
  }
  // Garder la valeur brute normalisée avec majuscule
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function findKey(keys: string[], field: string): string | null {
  const patterns = COL_PATTERNS[field] ?? [field];
  for (const key of keys) {
    const n = norm(key);
    if (patterns.some(p => n.includes(p))) return key;
  }
  return null;
}

// Trouver la ligne d'en-têtes automatiquement (certains fichiers ont des titres avant)
function findHeaderRowIndex(sheetRaw: any[][]): number {
  const allPatterns = Object.values(COL_PATTERNS).flat();
  let bestScore = -1;
  let bestIdx   = 0;
  for (let i = 0; i < Math.min(10, sheetRaw.length); i++) {
    const row = sheetRaw[i] ?? [];
    const nonEmpty = row.filter((c: any) => String(c ?? "").trim() !== "").length;
    if (nonEmpty < 2) continue;
    let score = 0;
    for (const cell of row) {
      const n = norm(cell);
      if (allPatterns.some(p => n.includes(p))) score++;
    }
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestIdx;
}

// ─── Parser + valider le fichier ─────────────────────────────────────────────

function parseAndValidate(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target!.result as ArrayBuffer), { type: "array" });

        // Prendre la première feuille non-instruction avec du contenu
        let ws: XLSX.WorkSheet | null = null;
        for (const name of wb.SheetNames) {
          if (norm(name).includes("instruction") || norm(name).includes("notice")) continue;
          const c = wb.Sheets[name];
          if (c && c["!ref"]) { ws = c; break; }
        }
        // Si toutes les feuilles sont filtrées, prendre la première
        if (!ws && wb.SheetNames.length > 0) ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) { reject(new Error("Fichier Excel vide ou illisible")); return; }

        // Lire toutes les lignes brutes
        const sheetRaw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as any[][];
        if (sheetRaw.length < 2) {
          reject(new Error("Le fichier ne contient pas assez de données.")); return;
        }

        // Détecter la ligne d'en-têtes (pas forcément la ligne 1)
        const headerIdx = findHeaderRowIndex(sheetRaw);
        const headerRow = (sheetRaw[headerIdx] ?? []).map((h: any) => String(h ?? "").trim());
        const allKeys   = headerRow.filter(h => h !== "");

        if (allKeys.length === 0) {
          reject(new Error("Impossible de lire les en-têtes du fichier.")); return;
        }

        // Construire les lignes de données à partir de la ligne suivant les en-têtes
        const jsonRows: Record<string, any>[] = sheetRaw
          .slice(headerIdx + 1)
          .map(row => {
            const obj: Record<string, any> = {};
            headerRow.forEach((key, i) => { if (key) obj[key] = (row as any[])[i]; });
            return obj;
          })
          .filter(row => Object.values(row).some(v => {
            const s = String(v ?? "").trim();
            return s !== "" && s !== "undefined";
          }));

        if (jsonRows.length === 0) {
          reject(new Error("Aucune donnée trouvée après les en-têtes.")); return;
        }

        // Détection des colonnes
        let k = {
          nom:           findKey(allKeys, "nom"),
          dateNaissance: findKey(allKeys, "dateNaissance"),
          sexe:          findKey(allKeys, "sexe"),
          pieceIdentite: findKey(allKeys, "pieceIdentite"),
          lien:          findKey(allKeys, "lien"),
          dateAdhesion:  findKey(allKeys, "dateAdhesion"),
          salaire:       findKey(allKeys, "salaire"),
          garantie:      findKey(allKeys, "garantie"),
        };

        // Fallback : si nom non détecté, prendre la première colonne avec des valeurs texte longues
        if (!k.nom) {
          for (const key of allKeys) {
            if (key === k.dateNaissance || key === k.sexe || key === k.pieceIdentite) continue;
            const samples = jsonRows.slice(0, 5).map(r => String(r[key] ?? "").trim()).filter(Boolean);
            const avgLen  = samples.reduce((a, s) => a + s.length, 0) / (samples.length || 1);
            if (avgLen > 4 && samples.some(s => /[a-zA-ZÀ-ÿ]/.test(s))) { k.nom = key; break; }
          }
        }

        const g = (row: Record<string, any>, key: string | null) =>
          key ? String(row[key] ?? "").trim() : "";

        const membres: MembrePopulation[] = [];
        const errors:  ValidationError[]  = [];
        const cniSeen: Set<string>        = new Set();

        jsonRows.forEach((row, i) => {
          const ligne = i + headerIdx + 2;

          // Récupérer le nom (ou chercher dans toutes les colonnes non encore affectées)
          let nom = g(row, k.nom);
          if (!nom) {
            // Dernière tentative : première valeur texte de la ligne
            for (const key of allKeys) {
              const v = String(row[key] ?? "").trim();
              if (v && /[a-zA-ZÀ-ÿ]/.test(v) && v.length > 2) { nom = v; break; }
            }
          }
          if (!nom) return; // ligne vraiment vide, on ignore silencieusement

          const dateNaissRaw = k.dateNaissance ? row[k.dateNaissance] : "";
          const sexeRaw      = g(row, k.sexe);
          const cni          = g(row, k.pieceIdentite);
          const lienRaw      = g(row, k.lien);
          const dateAdhRaw   = k.dateAdhesion ? row[k.dateAdhesion] : "";
          const salaireRaw   = g(row, k.salaire);
          const garantieRaw  = g(row, k.garantie);

          // ── Date de naissance ─────────────────────────────────────────────
          const dateNaissance = toDateStr(dateNaissRaw);
          if (dateNaissance && !isValidDate(dateNaissance)) {
            errors.push({ ligne, nom, champ: "Date de naissance", message: `Format non reconnu : "${String(dateNaissRaw).trim()}"` });
          }

          // ── Sexe ──────────────────────────────────────────────────────────
          const sexeNorm = norm(sexeRaw);
          let sexe = sexeNorm.startsWith("f") ? "F"
                   : (sexeNorm.startsWith("m") || sexeNorm.startsWith("h")) ? "M"
                   : "";

          // ── N° pièce d'identité ───────────────────────────────────────────
          let cniVal = cni;
          if (cni && cniSeen.has(cni)) return; // doublon silencieux
          if (cni) cniSeen.add(cni);

          // ── Lien ──────────────────────────────────────────────────────────
          const lien = normalizeLien(lienRaw);

          // ── Date d'adhésion ───────────────────────────────────────────────
          const dateAdhesion = toDateStr(dateAdhRaw);

          // ── Garantie ──────────────────────────────────────────────────────
          const garantieNorm  = norm(garantieRaw);
          const garantie = GARANTIES_AUTORISEES.find(g => norm(g) === garantieNorm)
                        ?? (garantieRaw || "Standard");

          const dn = isValidDate(dateNaissance) ? dateNaissance : "";
          membres.push({
            numero:        membres.length + 1,
            nom,
            dateNaissance: dn,
            sexe,
            pieceIdentite: cniVal || "",
            lien,
            dateAdhesion:  dateAdhesion || "",
            salaire:       salaireRaw || undefined,
            garantie,
            type:          typeFromDate(dn),
          });
        });

        if (membres.length === 0 && errors.length === 0) {
          reject(new Error(`Aucun membre trouvé. Colonnes détectées : ${allKeys.join(", ")}`));
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

const GARANTIE_COLORS: Record<string, string> = {
  Premium: "bg-purple-100 text-purple-700 border-purple-200",
  Confort:  "bg-blue-100 text-blue-700 border-blue-200",
  Standard: "bg-green-50 text-green-700 border-green-200",
};

function MembreRow({
  m, isPrincipal, onRemove, onGarantieChange,
}: {
  m: MembrePopulation;
  isPrincipal?: boolean;
  onRemove?: () => void;
  onGarantieChange?: (g: string) => void;
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

      {/* Lien avec l'adhérent principal */}
      <td className="px-3 py-2.5 w-32">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${
          m.lien === "Principal"
            ? "bg-blue-100 text-blue-700 border-blue-200"
            : "bg-white text-gray-700 border-gray-300"
        }`}>
          {m.lien || "—"}
        </span>
      </td>

      {/* Date d'adhésion */}
      <td className="px-3 py-2.5 text-sm text-gray-500 w-28 font-mono">
        {m.dateAdhesion || "—"}
      </td>

      {/* Salaire */}
      <td className="px-3 py-2.5 text-sm text-gray-500 w-28 font-mono">
        {m.salaire ? Number(m.salaire).toLocaleString("fr-FR") : "—"}
      </td>

      {/* Garantie — éditable */}
      <td className="px-3 py-2.5 w-28">
        {onGarantieChange ? (
          <select
            value={m.garantie || "Standard"}
            onChange={e => onGarantieChange(e.target.value)}
            className={`text-xs font-semibold border rounded px-1.5 py-0.5 cursor-pointer focus:outline-none ${GARANTIE_COLORS[m.garantie] ?? GARANTIE_COLORS.Standard}`}
          >
            {GARANTIES_AUTORISEES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        ) : (
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${GARANTIE_COLORS[m.garantie] ?? GARANTIE_COLORS.Standard}`}>
            {m.garantie || "—"}
          </span>
        )}
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

// ─── Historique d'imports ─────────────────────────────────────────────────────

interface ImportHistoryEntry {
  id:         string;
  date:       string;
  filename:   string;
  entreprise: string;
  nbMembres:  number;
  nbFamilles: number;
  nbErreurs:  number;
  duree:      string;
}

function getImportHistory(): ImportHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem("cnart_import_history") ?? "[]"); }
  catch { return []; }
}

function addImportHistory(entry: ImportHistoryEntry) {
  const h = getImportHistory();
  h.unshift(entry);
  if (h.length > 50) h.splice(50);
  localStorage.setItem("cnart_import_history", JSON.stringify(h));
}

// ─── Indicateur d'étapes ─────────────────────────────────────────────────────

function StepIndicator({ step }: { step: "formulaire" | "apercu" }) {
  const steps = [
    { key: "formulaire", label: "Informations & Fichier" },
    { key: "apercu",     label: "Aperçu" },
    { key: "enregistre", label: "Enregistrement" },
  ];
  const idx = step === "formulaire" ? 0 : 1;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1.5 font-medium px-2 py-1 rounded-full transition-colors ${
            i < idx  ? "bg-green-100 text-green-700" :
            i === idx ? "bg-blue-600 text-white" :
                        "bg-gray-100 text-gray-400"
          }`}>
            {i < idx
              ? <CheckCircle2 className="w-3 h-3" />
              : <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold border-current">{i + 1}</span>
            }
            {s.label}
          </span>
          {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function NewGroupePage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef   = useRef<HTMLInputElement>(null);

  // ── Étapes ──
  const [step, setStep] = useState<"formulaire" | "apercu">("formulaire");

  // ── UI ──
  const [editingId,       setEditingId]       = useState<number | null>(null);
  const [showGaranties,   setShowGaranties]   = useState(false);
  const [showReajust,     setShowReajust]     = useState(false);
  const [isDragging,      setIsDragging]      = useState(false);
  const [isAnalysing,     setIsAnalysing]     = useState(false);
  const [isSaving,        setIsSaving]        = useState(false);
  const [showErrors,      setShowErrors]      = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [currentPage,     setCurrentPage]     = useState(1);
  const [confirmLeave,    setConfirmLeave]    = useState(false);
  const PAGE_SIZE = 30;

  // ── Données ──
  const [pendingFile,  setPendingFile]  = useState<File | null>(null);
  const [fileName,     setFileName]     = useState<string>("");
  const [parseResult,  setParseResult]  = useState<ParseResult | null>(null);
  const [membres,      setMembres]      = useState<MembrePopulation[]>([]);
  const [tarifs, setTarifs] = useState<TarifSettings>(() => ({
    ...getTarifs(),
    primeEnfant: 0,
    primeAdulte: 0,
    primeAdulteAge: 0,
  }));
  const [cpManuel,          setCpManuel]          = useState<string>("");
  const [tauxRemboursement, setTauxRemboursement] = useState<number>(0);

  const [logo, setLogo] = useState<string>("");
  const [formData, setFormData] = useState({
    entreprise:    "",
    secteur:       "",
    dateDebut:     "",
    dureeGarantie: "1",
    echeanceAuto:  true,
  });

  const dateFin = useMemo(() => {
    if (!formData.dateDebut) return "";
    const d = new Date(formData.dateDebut);
    d.setFullYear(d.getFullYear() + Number(formData.dureeGarantie));
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("fr-FR");
  }, [formData.dateDebut, formData.dureeGarantie]);

  const decompte      = useMemo(() => calcDecomptePopulation(membres, tarifs), [membres, tarifs]);
  const duree         = Number(formData.dureeGarantie);
  // CP effectif : taux saisi par l'admin (%), sinon taux par défaut du service
  const tauxCpEffectif = cpManuel !== "" && !isNaN(Number(cpManuel)) ? Number(cpManuel) : decompte.tauxCP;
  const cpEffectif     = Math.round(decompte.primeNette * tauxCpEffectif / 100);
  const totalEffectif  = decompte.primeNette + cpEffectif + decompte.taxes;
  const familleGroups = useMemo(() => groupByPrincipal(membres), [membres]);
  const validationErrors = parseResult?.errors ?? [];

  // Formulaire valide avant d'autoriser le dépôt du fichier
  const formIsReady = !!(formData.entreprise.trim() && formData.secteur.trim() && formData.dateDebut);

  // Familles filtrées par recherche
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return familleGroups;
    return familleGroups.filter(fg => {
      const all = fg.principal ? [fg.principal, ...fg.ayantsDroit] : fg.ayantsDroit;
      return all.some(m => m.nom.toLowerCase().includes(q));
    });
  }, [familleGroups, searchQuery]);

  const totalPages   = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const pagedGroups  = filteredGroups.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const updateGarantie = (numero: number, garantie: string) => {
    setMembres(prev => prev.map(m => m.numero === numero ? { ...m, garantie } : m));
  };

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
          setParseResult({ membres: detail, errors: [] });
        }
        if (groupe.logo) setLogo(groupe.logo);
      })
      .catch(() => toast.error("Erreur lors du chargement"));
  }, [searchParams]);

  // ── Sélection fichier → analyse immédiate ──
  const handleFileSelect = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Format invalide — utilisez .xlsx ou .xls");
      return;
    }
    setPendingFile(file);
    setFileName(file.name);
    setParseResult(null);
    setMembres([]);
    setShowErrors(false);
    setIsAnalysing(true);
    try {
      const result = await parseAndValidate(file);
      setParseResult(result);
      setMembres(result.membres);
      if (result.errors.length > 0) setShowErrors(true);
      if (result.membres.length === 0 && result.errors.length === 0) {
        toast.error("Aucun membre trouvé dans le fichier");
        return;
      }
      setStep("apercu");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la lecture du fichier");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Étape 2 : Confirmer → Backend insert + historique ──
  const handleConfirm = async () => {
    if (membres.length === 0) return;
    setIsSaving(true);
    const payload = {
      entreprise:     formData.entreprise,
      logo:           logo || undefined,
      secteur:        formData.secteur,
      employes:       membres.length,
      assures:        membres.length,
      debut:          formData.dateDebut,
      dureeGarantie:  formData.dureeGarantie,
      echeanceAuto:   formData.echeanceAuto,
      prime:              (totalEffectif * duree).toString(),
      primeNette:         (decompte.primeNette * duree).toString(),
      cp:                 (cpEffectif * duree).toString(),
      taxes:              (decompte.taxes * duree).toString(),
      tauxRemboursement,
      tarifPrimeEnfant:   tarifs.primeEnfant,
      tarifPrimeAdulte:   tarifs.primeAdulte,
      tarifPrimeAdulteAge: tarifs.primeAdulteAge,
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
      // Sauvegarde historique
      addImportHistory({
        id:         Date.now().toString(),
        date:       new Date().toISOString(),
        filename:   fileName,
        entreprise: formData.entreprise,
        nbMembres:  membres.length,
        nbFamilles: familleGroups.length,
        nbErreurs:  validationErrors.length,
        duree:      formData.dureeGarantie,
      });
      navigate("/maladie-groupe");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  const removeMembre = (idx: number) =>
    setMembres(prev => prev.filter((_, i) => i !== idx));

  const doReset = () => {
    setStep("formulaire");
    setPendingFile(null);
    setFileName("");
    setMembres([]);
    setParseResult(null);
    setShowErrors(false);
    setSearchQuery("");
    setCurrentPage(1);
    setLogo("");
    setCpManuel("");
  };

  const resetToForm = () => {
    if (step === "apercu" && membres.length > 0) {
      setConfirmLeave(true);
    } else {
      doReset();
    }
  };

  // ─── Rendu ────────────────────────────────────────────────────────────────────

  const tableHeaders = (
    <tr>
      <th className="text-left px-4 py-2.5 text-gray-500 font-medium w-14">N°</th>
      <th className="text-left px-3 py-2.5 text-gray-500 font-medium min-w-[160px]">Nom et Prénom</th>
      <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-28">Date naissance</th>
      <th className="text-center px-3 py-2.5 text-gray-500 font-medium w-14">Sexe</th>
      <th className="text-left px-3 py-2.5 text-gray-500 font-medium min-w-[110px]">N° pièce</th>
      <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-28">Lien</th>
      <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-28">Date adhésion</th>
      <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-24">Salaire</th>
      <th className="text-left px-3 py-2.5 text-gray-500 font-medium w-28">Garantie</th>
      <th className="w-8" />
    </tr>
  );

  const membresTable = (
    <div>
      {/* Barre de recherche */}
      <div className="px-4 py-2.5 border-b bg-gray-50/60 flex items-center gap-2">
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder="Rechercher un membre par nom…"
          className="flex-1 text-xs bg-transparent outline-none placeholder:text-gray-400"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
            className="text-gray-400 hover:text-gray-600">
            <X className="w-3 h-3" />
          </button>
        )}
        {searchQuery && (
          <span className="text-xs text-muted-foreground shrink-0">
            {filteredGroups.length} famille{filteredGroups.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 border-b z-10">{tableHeaders}</thead>
          <tbody>
            {pagedGroups.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Aucun résultat pour « {searchQuery} »
                </td>
              </tr>
            ) : pagedGroups.map((fg, fi) => {
              const allInGroup = fg.principal ? [fg.principal, ...fg.ayantsDroit] : fg.ayantsDroit;
              const groupDecompte = calcDecomptePopulation(allInGroup, tarifs);
              const principalName = fg.principal?.nom ?? fg.ayantsDroit[0]?.nom ?? "—";
              const globalIdx = (currentPage - 1) * PAGE_SIZE + fi + 1;
              return (
                <Fragment key={fi}>
                  {/* ── En-tête famille ── */}
                  <tr className="bg-blue-600/5 border-t-2 border-blue-200">
                    <td colSpan={10} className="px-4 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            Famille {globalIdx}
                          </span>
                          <span className="text-xs font-semibold text-blue-800">{principalName}</span>
                          <span className="text-[10px] text-blue-500">
                            {allInGroup.length} personne{allInGroup.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-blue-600 font-semibold">
                          {(groupDecompte.total * duree).toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    </td>
                  </tr>
                  {fg.principal && (
                    <MembreRow
                      m={fg.principal}
                      isPrincipal
                      onRemove={() => removeMembre(membres.indexOf(fg.principal!))}
                      onGarantieChange={g => updateGarantie(fg.principal!.numero, g)}
                    />
                  )}
                  {fg.ayantsDroit.map((ad) => (
                    <MembreRow
                      key={`ad-${ad.numero}`}
                      m={ad}
                      onRemove={() => removeMembre(membres.indexOf(ad))}
                      onGarantieChange={g => updateGarantie(ad.numero, g)}
                    />
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t bg-gray-50/60 text-xs text-muted-foreground">
          <span>
            Familles {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredGroups.length)} sur {filteredGroups.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-6 h-6 rounded text-[11px] font-medium ${p === currentPage ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const errorsPanel = validationErrors.length > 0 && (
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
            {validationErrors.length} anomalie{validationErrors.length > 1 ? "s" : ""} détectée{validationErrors.length > 1 ? "s" : ""}
            {membres.length > 0 ? ` — ${membres.length} ligne${membres.length > 1 ? "s" : ""} valide${membres.length > 1 ? "s" : ""}` : " — aucun membre importé"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); downloadErrorFile(validationErrors, membres); }}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50"
          >
            <Download className="w-3 h-3" /> Rapport
          </button>
          {showErrors ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>
      {showErrors && (
        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium w-16">Ligne</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[130px]">Nom</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium min-w-[120px]">Champ</th>
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
  );

  const decompteSection = membres.length > 0 && (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 text-sm">
        {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
          <div key={t} className={`p-3 rounded-lg border ${TYPE_COLORS[t]}`}>
            <p className="text-xs opacity-80">{t === "enfant" ? "Enfant(s)" : t === "adulte" ? "Adulte(s)" : "Âgé(s)"}</p>
            <p className="font-bold text-lg">{decompte.nb[t]}</p>
            <p className="text-[10px] opacity-70">
              {(t === "enfant" ? tarifs.primeEnfant : t === "adulte" ? tarifs.primeAdulte : tarifs.primeAdulteAge).toLocaleString("fr-FR")} FCFA/pers
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden text-sm">
        <div className="bg-gray-50 px-4 py-2 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
          Décompte annuel × {duree} an{duree > 1 ? "s" : ""}
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
              {(row.value * duree).toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        ))}

        {/* CP — taux saisi par l'admin */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">CP — Chargements Professionnels</span>
            <span className="text-[11px] text-muted-foreground">
              Montant : {(cpEffectif * duree).toLocaleString("fr-FR")} FCFA
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
          <span className="font-mono text-sm">{(decompte.taxes * duree).toLocaleString("fr-FR")} FCFA</span>
        </div>

        {/* Total recalculé */}
        <div className="flex justify-between items-center px-4 py-3 border-t bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <span className="font-bold text-base">TOTAL À PAYER</span>
          <span className="font-bold text-xl font-mono">{(totalEffectif * duree).toLocaleString("fr-FR")} FCFA</span>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout subHeader={
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button size="sm"
          onClick={() => step === "apercu" ? resetToForm() : navigate("/maladie-groupe")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {step === "apercu" ? "Retour au formulaire" : "Retour à la liste"}
        </Button>
        <StepIndicator step={step} />
      </div>
    }>
      {/* ── Dialogue confirmation quitter ── */}
      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandonner la saisie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez importé <strong>{membres.length} membre{membres.length > 1 ? "s" : ""}</strong> non encore enregistrés.
              Retourner au formulaire effacera ces données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={doReset}
            >
              Oui, abandonner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* ══════════════ ÉTAPE 1 — FORMULAIRE ══════════════ */}
        {step === "formulaire" && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-1">
              {editingId ? "Modifier le Groupe" : "Nouveau Groupe"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Assurance Maladie Groupe — CNART Assurances · Taux de remboursement : <strong>{tauxRemboursement} %</strong>
            </p>

            <div className="space-y-8">

              {/* ── Entreprise ── */}
              <section className="space-y-4">
                <h3 className="font-semibold text-base border-b pb-2">Entreprise</h3>
                <div className="flex gap-5 items-start">
                  <LogoUpload logo={logo} onChange={setLogo} size={88} />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Nom de l'entreprise *</Label>
                      <Input value={formData.entreprise}
                        onChange={e => setFormData({ ...formData, entreprise: e.target.value })}
                        placeholder="Sonatel SA" />
                    </div>
                    <div>
                      <Label>Secteur d'activité *</Label>
                      <Input value={formData.secteur}
                        onChange={e => setFormData({ ...formData, secteur: e.target.value })}
                        placeholder="Télécommunications, Finance…" />
                    </div>
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
                    <Input type="date" value={formData.dateDebut}
                      onChange={e => setFormData({ ...formData, dateDebut: e.target.value })} />
                  </div>
                  <div>
                    <Label>Date d'échéance (calculée)</Label>
                    <Input readOnly value={dateFin}
                      className="bg-gray-50 text-muted-foreground cursor-not-allowed" placeholder="—" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                  <button type="button"
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

              {/* ── Tarification ── */}
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

              {/* ── Import fichier ── */}
              <section className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" /> Population à assurer
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
                    <Download className="w-4 h-4" /> Modèle Excel
                  </Button>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-700 space-y-0.5">
                    <p className="font-semibold text-sm text-blue-800">Format accepté</p>
                    <p>Une ligne par personne — regroupées par famille (Principal d'abord, puis Conjoint, Enfants…)</p>
                    <p><strong>Seul le nom est obligatoire.</strong> Colonnes reconnues automatiquement quelle que soit la mise en forme.</p>
                    <p><strong>Liens acceptés :</strong> {LIENS_AUTORISES.join(" · ")}</p>
                  </div>
                </div>

                {/* Zone dépôt */}
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileInput} className="hidden" />

                {/* Alerte si formulaire incomplet */}
                {!formIsReady && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    Remplissez d'abord l'entreprise, le secteur et la date de début pour importer un fichier.
                  </div>
                )}

                <div
                  onClick={() => formIsReady && fileInputRef.current?.click()}
                  onDragOver={e => { if (!formIsReady) return; e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { if (!formIsReady) return; handleDrop(e); }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    !formIsReady
                      ? "border-gray-200 bg-gray-50/50 opacity-50 cursor-not-allowed"
                    : isDragging  ? "border-blue-500 bg-blue-50 cursor-pointer"
                    : pendingFile ? "border-blue-400 bg-blue-50/40 cursor-pointer"
                    : membres.length > 0 ? "border-green-400 bg-green-50 cursor-pointer"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50 cursor-pointer"
                  }`}
                >
                  {isAnalysing ? (
                    <div className="flex flex-col items-center gap-2 text-blue-700">
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                      <p className="text-sm font-semibold">Lecture en cours…</p>
                      <p className="text-xs text-blue-500">{fileName}</p>
                    </div>
                  ) : pendingFile && membres.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-blue-700">
                      <FileSpreadsheet className="w-10 h-10 text-blue-500" />
                      <p className="text-sm font-semibold">{fileName}</p>
                      <p className="text-xs text-blue-500">Cliquer pour changer</p>
                    </div>
                  ) : membres.length > 0 ? (
                    <div className="flex flex-col items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                      <p className="text-sm font-semibold">{fileName}</p>
                      <p className="text-xs text-green-600">{membres.length} membre{membres.length > 1 ? "s" : ""} · {familleGroups.length} famille{familleGroups.length > 1 ? "s" : ""} · Cliquer pour importer un nouveau fichier</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <FileSpreadsheet className="w-10 h-10 text-gray-400" />
                      <p className="text-sm font-semibold">Glisser-déposer votre fichier Excel ici</p>
                      <p className="text-xs text-muted-foreground">ou cliquer pour sélectionner · .xlsx, .xls</p>
                    </div>
                  )}
                </div>
              </section>

            </div>

            {/* Bouton "Voir l'aperçu" uniquement en mode édition avec population déjà chargée */}
            {membres.length > 0 && !pendingFile && (
              <div className="pt-2">
                <Button
                  type="button"
                  className="w-full py-5 text-base gap-2"
                  onClick={() => setStep("apercu")}
                >
                  <Eye className="w-5 h-5" /> Voir l'aperçu <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* ══════════════ ÉTAPE 2 — APERÇU ══════════════ */}
        {step === "apercu" && (
          <div className="space-y-5">

            {/* Bandeau récapitulatif */}
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {logo ? (
                    <img src={logo} alt="logo" className="w-14 h-14 rounded-xl object-contain border border-gray-200 bg-white p-1 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-200 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-blue-600">
                        {formData.entreprise.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{formData.entreprise}</h2>
                    <p className="text-sm text-muted-foreground">{formData.secteur} · Début : {formData.dateDebut} · {formData.dureeGarantie} an{+formData.dureeGarantie > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-2xl font-bold text-blue-700">{membres.length}</p>
                    <p className="text-xs text-blue-600">Membres</p>
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-purple-50 border border-purple-100">
                    <p className="text-2xl font-bold text-purple-700">{familleGroups.length}</p>
                    <p className="text-xs text-purple-600">Familles</p>
                  </div>
                  {validationErrors.length > 0 && (
                    <div className="px-4 py-2 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-2xl font-bold text-amber-700">{validationErrors.length}</p>
                      <p className="text-xs text-amber-600">Anomalies</p>
                    </div>
                  )}
                  <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-100">
                    <p className="text-lg font-bold text-green-700">{(totalEffectif * duree).toLocaleString("fr-FR")}</p>
                    <p className="text-xs text-green-600">FCFA total</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Anomalies */}
            {errorsPanel}

            {/* Tableau membres */}
            {membres.length > 0 && (
              <Card className="overflow-hidden p-0">
                <div className="px-4 py-3 flex justify-between items-center border-b bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Population ({membres.length} membre{membres.length > 1 ? "s" : ""} · {familleGroups.length} famille{familleGroups.length > 1 ? "s" : ""})
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{fileName}</span>
                    <button type="button"
                      onClick={resetToForm}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Changer le fichier
                    </button>
                  </div>
                </div>
                {membresTable}
              </Card>
            )}

            {/* Décompte */}
            <Card className="p-5">
              <h3 className="font-semibold text-base border-b pb-2 mb-4">Décompte de la prime</h3>
              {decompteSection}
            </Card>

            {/* Garanties */}
            <Card className="p-0 overflow-hidden">
              <button type="button" onClick={() => setShowGaranties(!showGaranties)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-sm">Tableau des garanties — Prise en charge au Sénégal</span>
                {showGaranties ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showGaranties && (
                <div className="overflow-x-auto border-t">
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
                          <td className="p-3 text-center font-bold text-green-700">{tauxRemboursement} %</td>
                          <td className="p-3 text-xs text-muted-foreground">{row.plafond}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Réajustement S/P */}
            <Card className="p-0 overflow-hidden">
              <button type="button" onClick={() => setShowReajust(!showReajust)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-sm">Réajustement de la prime — Rapport S/P</span>
                {showReajust ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showReajust && (
                <div className="border-t">
                  <div className="p-3 bg-amber-50 border-b text-xs text-amber-800">
                    Dans les 3 mois suivant l'échéance, un avenant est établi selon le rapport S/P.
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
            </Card>

            {/* ── Boutons d'action ── */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 py-5" onClick={resetToForm}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
              </Button>
              <Button
                className="flex-[2] py-5 text-base gap-2 bg-green-600 hover:bg-green-700"
                disabled={membres.length === 0 || isSaving}
                onClick={handleConfirm}
              >
                {isSaving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement…</>
                ) : (
                  <><Save className="w-5 h-5" />
                  {editingId ? "Confirmer la modification" : "Confirmer et enregistrer"}
                  </>
                )}
              </Button>
            </div>

            {/* Note historique */}
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              L'import sera sauvegardé dans l'historique à la confirmation.
            </p>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
