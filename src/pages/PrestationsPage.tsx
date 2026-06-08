import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { apiClient } from "@/services/apiClient";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Pill, Stethoscope, Activity, Building2, ChevronDown, ChevronUp,
  Search, X, Clock, CheckCircle, XCircle, AlertCircle, Filter,
} from "@/components/ui/Icons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prestataire {
  id: number;
  nom: string;
  type: string;
  email?: string;
  statut?: string;
  numero?: string;
}

interface LignePrestation {
  id: number;
  produitId?: number;
  produitNom?: string;
  quantite?: number;
  statut: string;
  fourniPar?: { id?: number; nom?: string };
  prestationId?: number;
  dateFourniture?: string;
}

interface Prestation {
  id: number;
  type: string;
  statut: string;
  ordonnanceReference?: string;
  ordonnanceId?: string | number;
  dateExecution?: string;
  createdAt?: string;
  assure?: { id?: number; nom?: string; prenom?: string; numero?: string; email?: string };
  prestataireDemandeur?: { id?: number; nom?: string; type?: string };
  lignes?: LignePrestation[];
}

// ─── Référentiels ────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  MEDICAMENT:      "Médicament",
  CONSULTATION:    "Consultation",
  ANALYSE:         "Analyse",
  HOSPITALISATION: "Hospitalisation",
  CHIRURGIE:       "Chirurgie",
  AUTRE:           "Autre",
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS:   "En cours",
  FOURNIE:    "Fournie",
  ANNULEE:    "Annulée",
  REFUSEE:    "Refusée",
};

const STATUT_CONFIG: Record<string, { badge: string; dot: string; icon: React.ReactNode; priority: number }> = {
  EN_ATTENTE: { badge: "bg-amber-50 text-amber-800 border-amber-300",    dot: "bg-amber-400",   icon: <Clock size={11} />,        priority: 1 },
  EN_COURS:   { badge: "bg-blue-50  text-blue-800  border-blue-300",     dot: "bg-blue-500",    icon: <Activity size={11} />,     priority: 2 },
  FOURNIE:    { badge: "bg-emerald-50 text-emerald-800 border-emerald-300", dot: "bg-emerald-500", icon: <CheckCircle size={11} />, priority: 3 },
  ANNULEE:    { badge: "bg-red-50   text-red-700   border-red-300",      dot: "bg-red-400",     icon: <XCircle size={11} />,      priority: 4 },
  REFUSEE:    { badge: "bg-slate-50 text-slate-600 border-slate-300",    dot: "bg-slate-400",   icon: <XCircle size={11} />,      priority: 4 },
};

// Kept for backward compatibility inside lignes
const STATUT_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUT_CONFIG).map(([k, v]) => [k, v.badge])
);

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  PHARMACIE:      <Pill      className="w-3.5 h-3.5" />,
  HOPITAL:        <Stethoscope className="w-3.5 h-3.5" />,
  CLINIQUE:       <Activity  className="w-3.5 h-3.5" />,
  LABORATOIRE:    <Activity  className="w-3.5 h-3.5" />,
  CABINET_MEDICAL:<Stethoscope className="w-3.5 h-3.5" />,
  AUTRE:          <Building2 className="w-3.5 h-3.5" />,
};

/** Prestataires compatibles selon le type de prestation */
const compatibleTypes: Record<string, string[]> = {
  MEDICAMENT:      ["PHARMACIE"],
  HOSPITALISATION: ["HOPITAL"],
  CHIRURGIE:       ["HOPITAL"],
  CONSULTATION:    ["CLINIQUE", "CABINET_MEDICAL"],
  ANALYSE:         ["LABORATOIRE"],
  AUTRE:           ["AUTRE", "CABINET_MEDICAL", "CLINIQUE", "HOPITAL", "LABORATOIRE", "PHARMACIE"],
};

// ─── Composant ───────────────────────────────────────────────────────────────

export default function PrestationsPage() {
  const navigate  = useNavigate();
  const { user, myPrestataire: currentProvider } = useAuth();

  const isAdmin       = user?.role === "admin";
  const isPrestataire = user?.role === "prestataire";
  const isClient      = user?.role === "client";

  const [prestations,         setPrestations]         = useState<Prestation[]>([]);
  const [lignes,              setLignes]              = useState<Record<string, LignePrestation[]>>({});
  const [expanded,            setExpanded]            = useState<Record<string, boolean>>({});
  const [loading,             setLoading]             = useState(true);
  const [loadError,           setLoadError]           = useState<string | null>(null);
  const [loadingLines,        setLoadingLines]        = useState<Record<string, boolean>>({});
  const [actionLoading,       setActionLoading]       = useState<string | null>(null);
  const [prestataires,        setPrestataires]        = useState<Prestataire[]>([]);
  const [selectedByLigne,     setSelectedByLigne]     = useState<Record<string, string>>({});
  const [search,              setSearch]              = useState("");
  const [confirmDialog,       setConfirmDialog]       = useState<{
    open: boolean;
    type: "fournir" | "refuser" | null;
    ligne: LignePrestation | null;
    prestationId: string | null;
    prescriptionId: number | null;
  }>({ open: false, type: null, ligne: null, prestationId: null, prescriptionId: null });
  const [prescriptions,       setPrescriptions]       = useState<any[]>([]);
  const [loadingPrescriptions,setLoadingPrescriptions]= useState(false);
  const [statutFilter,        setStatutFilter]        = useState("TOUS");

  // ─── Chargement ─────────────────────────────────────────────────────────

  const loadPrestations = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await DataService.getPrestations();
      // data peut être un tableau ou undefined selon la réponse backend
      const list = Array.isArray(data) ? data : [];
      setPrestations(list);
    } catch (err: any) {
      const msg = err?.message ?? "Impossible de charger les prestations";
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadPrestataires = async () => {
    if (!isAdmin && !isPrestataire) return;
    try {
      const data = await DataService.getPrestataires();
      setPrestataires((data ?? []).filter((p: any) => p.statut === "ACTIF" || !p.statut));
    } catch {
      // Prestataires non critiques — page reste fonctionnelle sans eux
    }
  };

  const loadLignes = async (prestationId: string, force = false) => {
    if (!force && lignes[prestationId] !== undefined) {
      setExpanded((prev) => ({ ...prev, [prestationId]: !prev[prestationId] }));
      return;
    }
    setLoadingLines((prev) => ({ ...prev, [prestationId]: true }));
    try {
      const data = await DataService.getPrestationLignes(prestationId);
      setLignes((prev) => ({ ...prev, [prestationId]: data ?? [] }));
      setExpanded((prev) => ({ ...prev, [prestationId]: true }));
    } catch (err: any) {
      toast.error("Erreur", { description: err?.message ?? "Impossible de charger les lignes" });
    } finally {
      setLoadingLines((prev) => ({ ...prev, [prestationId]: false }));
    }
  };

  useEffect(() => {
    loadPrestations();
    loadPrestataires();
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────

  const openConfirm = async (type: "fournir" | "refuser", ligne: LignePrestation, prestationId: string) => {
    if (type === "fournir") {
      const targetId = isPrestataire
        ? currentProvider?.id
        : Number(selectedByLigne[String(ligne.id)]);
      if (!targetId) {
        toast.error("Prestataire requis", { description: "Sélectionnez un prestataire avant de valider." });
        return;
      }
    }
    setConfirmDialog({ open: true, type, ligne, prestationId, prescriptionId: null });
    setPrescriptions([]);

    // Charger les prescriptions si prestation de type MEDICAMENT
    const prestation = prestations.find(p => String(p.id) === prestationId);
    if (type === "fournir" && prestation?.type === "MEDICAMENT" && prestation.assure?.id) {
      setLoadingPrescriptions(true);
      try {
        const data = await apiClient.getPrescriptionsByAssure(prestation.assure.id);
        setPrescriptions(Array.isArray(data) ? data : []);
      } catch {
        setPrescriptions([]);
      } finally {
        setLoadingPrescriptions(false);
      }
    }
  };

  const handleConfirmed = async () => {
    const { type, ligne, prestationId } = confirmDialog;
    if (!ligne || !prestationId) return;
    setConfirmDialog(prev => ({ ...prev, open: false }));

    if (type === "fournir") {
      const targetId = isPrestataire
        ? currentProvider?.id
        : Number(selectedByLigne[String(ligne.id)]);
      if (!targetId) return;
      setActionLoading(String(ligne.id));
      try {
        await DataService.fournirLignePrestation(String(ligne.id), targetId, confirmDialog.prescriptionId);
        toast.success("Ligne validée", { description: "La ligne a été marquée comme fournie." });
        await loadLignes(prestationId, true);
        await loadPrestations();
      } catch (err: any) {
        toast.error("Erreur", { description: err?.message ?? "Impossible de valider la fourniture." });
      } finally {
        setActionLoading(null);
      }
    }

    if (type === "refuser") {
      setActionLoading(`refus-${ligne.id}`);
      try {
        await DataService.refuserLignePrestation(String(ligne.id));
        toast.warning("Ligne refusée", { description: "La ligne a été marquée comme refusée." });
        await loadLignes(prestationId, true);
        await loadPrestations();
      } catch (err: any) {
        toast.error("Erreur", { description: err?.message ?? "Impossible de refuser la ligne." });
      } finally {
        setActionLoading(null);
      }
    }
  };

  // ─── Filtrage + stats ────────────────────────────────────────────────────

  const filteredPrestations = useMemo(() => {
    const q = search.toLowerCase().trim();
    return prestations.filter(p => {
      const matchStatut = statutFilter === "TOUS" || p.statut === statutFilter;
      if (!matchStatut) return false;
      if (!q) return true;
      const assureStr = p.assure ? `${p.assure.nom ?? ""} ${p.assure.prenom ?? ""}`.toLowerCase() : "";
      return (
        assureStr.includes(q) ||
        (TYPE_LABELS[p.type] ?? p.type ?? "").toLowerCase().includes(q) ||
        (p.ordonnanceReference ?? "").toLowerCase().includes(q) ||
        (p.prestataireDemandeur?.nom ?? "").toLowerCase().includes(q)
      );
    });
  }, [prestations, search, statutFilter]);

  const stats = useMemo(() => {
    const counts = prestations.reduce((acc, p) => {
      const s = p.statut ?? "EN_ATTENTE";
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return {
      total:     prestations.length,
      enAttente: counts.EN_ATTENTE ?? 0,
      enCours:   counts.EN_COURS   ?? 0,
      fournies:  counts.FOURNIE    ?? 0,
      annulees:  counts.ANNULEE    ?? 0,
    };
  }, [prestations]);

  // ─── Helpers ────────────────────────────────────────────────────────────

  const roleMessage = isClient
    ? "Vous consultez votre dossier de prestations. Les lignes fournies sont verrouillées par le prestataire."
    : isPrestataire
      ? "Vous pouvez valider les lignes en attente pour les prestations qui vous sont affectées."
      : "Suivez, validez et affectez des prestataires aux lignes en attente.";

  const compatiblePrestataires = (prestationType: string) => {
    const allowed = compatibleTypes[prestationType] ?? Object.keys(PROVIDER_ICONS);
    return prestataires.filter((p) => allowed.includes(p.type));
  };

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : null;

  // ─── Rendu ──────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Prestations médicales">
      <div className="space-y-4 sm:space-y-5 px-4 sm:px-6">

        {/* Bandeau prestataire */}
        {isPrestataire && currentProvider && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Stethoscope size={18} className="text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-800 truncate">{currentProvider.nom}</p>
              <p className="text-xs text-blue-600">
                {stats.enAttente > 0
                  ? `${stats.enAttente} ligne${stats.enAttente > 1 ? "s" : ""} en attente de traitement`
                  : "Aucune ligne en attente — tout est à jour"}
              </p>
            </div>
            {stats.enAttente > 0 && (
              <span className="w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                {stats.enAttente}
              </span>
            )}
          </div>
        )}

        {/* KPI cliquables */}
        {!loading && !loadError && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {([
              { key: "TOUS",       label: "Total",      value: stats.total,     icon: <Filter size={14} />,       bg: "bg-slate-50",    border: "border-slate-200", num: "text-slate-900",   iconBg: "bg-slate-600"   },
              { key: "EN_ATTENTE", label: "En attente", value: stats.enAttente, icon: <Clock size={14} />,        bg: "bg-amber-50",    border: "border-amber-200", num: "text-amber-900",   iconBg: "bg-amber-500"   },
              { key: "EN_COURS",   label: "En cours",   value: stats.enCours,   icon: <Activity size={14} />,     bg: "bg-blue-50",     border: "border-blue-200",  num: "text-blue-900",    iconBg: "bg-blue-600"    },
              { key: "FOURNIE",    label: "Fournies",   value: stats.fournies,  icon: <CheckCircle size={14} />,  bg: "bg-emerald-50",  border: "border-emerald-200",num:"text-emerald-900", iconBg: "bg-emerald-600" },
            ] as const).map(({ key, label, value, icon, bg, border, num, iconBg }) => (
              <button
                key={key}
                onClick={() => setStatutFilter(statutFilter === key ? "TOUS" : key)}
                className={`${bg} border ${border} rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 text-left transition-all hover:shadow-sm ${statutFilter === key ? "ring-2 ring-offset-1 ring-current opacity-100" : "opacity-80 hover:opacity-100"}`}
              >
                <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center text-white shrink-0`}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-lg sm:text-2xl font-bold ${num} leading-none`}>{value}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{label}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Barre de recherche + actions */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 sm:max-w-md px-3 py-2 rounded-lg border border-input bg-card">
            <Search size={15} className="text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par assuré, type, ordonnance..."
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={loadPrestations} variant="outline" size="sm">Rafraîchir</Button>
            {(isAdmin || isPrestataire) && (
              <Button onClick={() => navigate("/prestations/new")} size="sm">
                + Nouvelle
              </Button>
            )}
          </div>
        </div>

        {/* Compteur résultats */}
        {!loading && !loadError && (
          <p className="text-xs text-muted-foreground">
            {filteredPrestations.length} prestation{filteredPrestations.length !== 1 ? "s" : ""}
            {(search || statutFilter !== "TOUS") && " — filtrées"}
          </p>
        )}

        {/* Alerte prestataire non lié */}
        {isPrestataire && !currentProvider && !loading && (
          <Card className="p-4 border border-amber-200 bg-amber-50 flex items-start gap-3">
            <span className="text-amber-500 mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-900">Compte non lié à un prestataire actif</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Votre adresse email ne correspond à aucun prestataire actif dans le système. Contactez l'administrateur.
              </p>
            </div>
          </Card>
        )}

        {/* Erreur visible (non effaçable comme un toast) */}
        {loadError && (
          <Card className="p-5 border border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-lg mt-0.5">⚠</span>
              <div className="min-w-0">
                <p className="font-semibold text-red-800 text-sm">Impossible de charger les prestations</p>
                <p className="text-xs text-red-600 mt-0.5 font-mono break-all">{loadError}</p>
                <button
                  onClick={loadPrestations}
                  className="mt-2 text-xs underline text-red-700 hover:text-red-900"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Liste des prestations */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => i).map((i) => (
              <div key={i} className="bg-card rounded-xl p-5 border border-border animate-pulse">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex gap-2">
                    <div className="h-5 w-24 bg-muted rounded-full" />
                    <div className="h-5 w-20 bg-muted rounded-full" />
                  </div>
                  <div className="h-8 w-28 bg-muted rounded-lg shrink-0" />
                </div>
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredPrestations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <Pill size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold text-sm">
              {search || statutFilter !== "TOUS" ? "Aucune prestation correspondante" : "Aucune prestation disponible"}
            </p>
            {!search && statutFilter === "TOUS" && (
              <p className="text-sm text-muted-foreground max-w-sm">
                {isClient ? "Aucune prestation n'est associée à votre dossier." : "Les prestations apparaîtront ici dès qu'elles seront enregistrées."}
              </p>
            )}
            {(search || statutFilter !== "TOUS") && (
              <button onClick={() => { setSearch(""); setStatutFilter("TOUS"); }} className="text-xs text-blue-600 hover:underline">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrestations.map((prestation, idx) => {
              const key = String(prestation.id);
              const isOpen = expanded[key];
              const lignesLoading = loadingLines[key];
              const lignesData = lignes[key] ?? [];
              const ligneCount = prestation.lignes?.length ?? lignesData.length;

              const statutCfg = STATUT_CONFIG[prestation.statut] ?? STATUT_CONFIG.EN_ATTENTE;
              const isUrgent  = prestation.statut === "EN_ATTENTE" && prestation.createdAt &&
                (Date.now() - new Date(prestation.createdAt).getTime()) > 48 * 3600 * 1000;

              return (
                <motion.div
                  key={prestation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.25) }}
                  className={`bg-card rounded-xl overflow-hidden border transition-shadow hover:shadow-md ${isUrgent ? "border-amber-300" : "border-border"}`}
                >
                  {/* Barre urgence */}
                  {isUrgent && (
                    <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-1.5">
                      <AlertCircle size={12} className="text-amber-600 shrink-0" />
                      <p className="text-[11px] font-semibold text-amber-700">En attente depuis plus de 48h — action requise</p>
                    </div>
                  )}

                  {/* Header de la prestation */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs font-medium">
                          {TYPE_LABELS[prestation.type] ?? prestation.type}
                        </Badge>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statutCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statutCfg.dot}`} />
                          {statutCfg.icon}
                          {STATUT_LABELS[prestation.statut] ?? prestation.statut}
                        </span>
                      </div>

                      <p className="font-semibold text-slate-900">
                        Ordonnance {prestation.ordonnanceReference ?? `#${prestation.ordonnanceId ?? prestation.id}`}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-slate-500">
                        {prestation.assure && (
                          <span>
                            Assuré : <span className="text-slate-700 font-medium">
                              {prestation.assure.nom} {prestation.assure.prenom}
                            </span>
                            {prestation.assure.numero && (
                              <span className="ml-1 text-xs text-slate-400">#{prestation.assure.numero}</span>
                            )}
                          </span>
                        )}
                        {prestation.prestataireDemandeur && (
                          <span>
                            Demandeur : <span className="text-slate-700 font-medium">
                              {prestation.prestataireDemandeur.nom}
                            </span>
                          </span>
                        )}
                        {formatDate(prestation.createdAt) && (
                          <span>Créée le {formatDate(prestation.createdAt)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400">{ligneCount} ligne{ligneCount !== 1 ? "s" : ""}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadLignes(key)}
                        className="gap-1.5"
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isOpen ? "Masquer" : "Voir les lignes"}
                      </Button>
                    </div>
                  </div>

                  {/* Lignes de prestation */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {lignesLoading ? (
                        <div className="py-8 flex justify-center items-center gap-2 text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Chargement des lignes...</span>
                        </div>
                      ) : lignesData.length === 0 ? (
                        <div className="py-6 text-center text-sm text-slate-500">
                          Aucune ligne pour cette prestation.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {lignesData.map((ligne) => {
                            const ligneKey = String(ligne.id);
                            const isFournie = ligne.statut === "FOURNIE";
                            const isEnAttente = ligne.statut === "EN_ATTENTE";
                            const compat = compatiblePrestataires(prestation.type);
                            const isFournirLoading = actionLoading === ligneKey;
                            const isRefuserLoading = actionLoading === `refus-${ligneKey}`;
                            const anyLoading = actionLoading !== null;

                            return (
                              <div key={ligne.id} className="px-5 py-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                                  {/* Info produit */}
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {ligne.produitNom ?? `Produit #${ligne.produitId}`}
                                    </p>
                                    <p className="text-sm text-slate-500">Quantité : {ligne.quantite ?? 1}</p>
                                    {isFournie && ligne.fourniPar && (
                                      <p className="text-xs text-emerald-600 mt-0.5">
                                        ✓ Fourni par {ligne.fourniPar.nom}
                                        {ligne.dateFourniture && ` · ${formatDate(ligne.dateFourniture)}`}
                                      </p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {(() => {
                                      const lCfg = STATUT_CONFIG[ligne.statut] ?? STATUT_CONFIG.EN_ATTENTE;
                                      return (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${lCfg.badge}`}>
                                          {lCfg.icon}
                                          {STATUT_LABELS[ligne.statut] ?? ligne.statut}
                                        </span>
                                      );
                                    })()}

                                    {/* Sélecteur prestataire (admin uniquement, ligne en attente) */}
                                    {isAdmin && isEnAttente && (
                                      <div className="relative">
                                        <select
                                          value={selectedByLigne[ligneKey] ?? ""}
                                          onChange={(e) => setSelectedByLigne((prev) => ({ ...prev, [ligneKey]: e.target.value }))}
                                          className="appearance-none pl-3 pr-8 py-1.5 border border-slate-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="">
                                            {compat.length === 0 ? "Aucun prestataire compatible" : "Choisir un prestataire…"}
                                          </option>
                                          {compat.map((p) => (
                                            <option key={p.id} value={p.id}>
                                              {p.nom} ({p.type})
                                            </option>
                                          ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                      </div>
                                    )}

                                    {/* Bouton Fournir */}
                                    {!isClient && isEnAttente && (
                                      <Button
                                        size="sm"
                                        disabled={
                                          anyLoading ||
                                          (isAdmin && !selectedByLigne[ligneKey]) ||
                                          (isPrestataire && !currentProvider)
                                        }
                                        onClick={() => openConfirm("fournir", ligne, key)}
                                      >
                                        {isFournirLoading ? (
                                          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Traitement...</>
                                        ) : "Marquer fournie"}
                                      </Button>
                                    )}

                                    {/* Bouton Refuser (admin + prestataire) */}
                                    {!isClient && isEnAttente && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        disabled={anyLoading}
                                        onClick={() => openConfirm("refuser", ligne, key)}
                                      >
                                        {isRefuserLoading ? (
                                          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />...</>
                                        ) : "Refuser"}
                                      </Button>
                                    )}

                                    {isClient && (
                                      <Badge variant="outline" className="text-xs text-slate-500">Lecture seule</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de confirmation — Fournir / Refuser */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "fournir"
                ? "Confirmer la fourniture"
                : "Confirmer le refus"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "fournir"
                ? `Marquer "${confirmDialog.ligne?.produitNom ?? "cette ligne"}" comme fournie ? Cette action ne peut pas être annulée.`
                : `Refuser "${confirmDialog.ligne?.produitNom ?? "cette ligne"}" ? Le demandeur sera notifié du refus.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Sélecteur d'ordonnance pour les prestations MEDICAMENT */}
          {confirmDialog.type === "fournir" && (
            <div className="px-1 pb-2">
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Ordonnance liée <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              {loadingPrescriptions ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement des ordonnances…
                </div>
              ) : prescriptions.length > 0 ? (
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={confirmDialog.prescriptionId ?? ""}
                  onChange={e => setConfirmDialog(prev => ({
                    ...prev,
                    prescriptionId: e.target.value ? Number(e.target.value) : null
                  }))}
                >
                  <option value="">— Aucune ordonnance —</option>
                  {prescriptions.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.medicament} — {p.dosage} ({p.prescripteur?.nom ?? "médecin"})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-400 italic py-1">Aucune ordonnance disponible pour cet assuré.</p>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmed}
              className={confirmDialog.type === "refuser"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              {confirmDialog.type === "fournir" ? "Confirmer fourniture" : "Confirmer refus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

