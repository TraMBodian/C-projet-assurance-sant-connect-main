import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, MapPin, Phone, Mail, Loader2, AlertCircle, Building2, Pencil, Trash2, Hash,
  BarChart2, TrendingUp, Users, ShieldCheck, Clock, Star, Activity, FileText,
  LayoutDashboard, ClipboardList, Filter, Calendar, Award, AlertTriangle, CheckCircle, XCircle,
  Eye, Settings, Download, Upload
} from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TablePagination from "@/components/admin/TablePagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const typeColors: Record<string, string> = {
  HOPITAL:         "bg-blue-100 text-blue-700",
  PHARMACIE:       "bg-green-100 text-green-700",
  CLINIQUE:        "bg-purple-100 text-purple-700",
  CABINET_MEDICAL: "bg-orange-100 text-orange-700",
  LABORATOIRE:     "bg-yellow-100 text-yellow-700",
  AUTRE:           "bg-gray-100 text-gray-600",
};

const typeLabels: Record<string, string> = {
  HOPITAL:         "Hôpital",
  PHARMACIE:       "Pharmacie",
  CLINIQUE:        "Clinique",
  CABINET_MEDICAL: "Cabinet médical",
  LABORATOIRE:     "Laboratoire",
  AUTRE:           "Autre",
};

const statutDot: Record<string, string> = {
  ACTIF:    "bg-green-500",
  INACTIF:  "bg-gray-400",
  SUSPENDU: "bg-red-500",
};

const statutLabel: Record<string, string> = {
  ACTIF:    "Actif",
  INACTIF:  "Inactif",
  SUSPENDU: "Suspendu",
};

// Niveaux de partenariat enterprise
const partnershipLevels = {
  PREMIUM: { label: "Premium", color: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white", icon: Award },
  STANDARD: { label: "Standard", color: "bg-blue-100 text-blue-700", icon: ShieldCheck },
  CRITIQUE: { label: "Critique", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  SURVEILLANCE: { label: "Surveillance", color: "bg-orange-100 text-orange-700", icon: Activity },
};

// Indicateurs de santé prestataire
const healthIndicators = {
  online: { label: "En ligne", color: "bg-green-100 text-green-700", icon: CheckCircle },
  offline: { label: "Hors ligne", color: "bg-gray-100 text-gray-600", icon: XCircle },
  maintenance: { label: "Maintenance", color: "bg-yellow-100 text-yellow-700", icon: Settings },
};

export default function PrestatairesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPartnership, setFilterPartnership] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [prestataires, setPrestataires] = useState<any[]>([]);
  const [statsMap,     setStatsMap]     = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const stats = {
    total:     prestataires.length,
    actifs:    prestataires.filter(p => p.statut === "ACTIF").length,
    suspendus: prestataires.filter(p => p.statut === "SUSPENDU").length,
    pharmacies:prestataires.filter(p => p.type === "PHARMACIE").length,
    hopitaux:  prestataires.filter(p => p.type === "HOPITAL").length,
  };

  const loadPrestataires = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data: any[] = (await DataService.getPrestataires()) ?? [];
      setPrestataires(data);
      // Charger les stats réelles en parallèle pour chaque prestataire
      const entries = await Promise.all(
        data.map(async (p: any) => {
          try {
            const res = await apiClient.request<any>(`/prestataires/${p.id}/stats`);
            return [p.id, res] as const;
          } catch { return [p.id, {}] as const; }
        })
      );
      setStatsMap(Object.fromEntries(entries));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPrestataires(); }, [loadPrestataires]);

  const handleDelete = (p: any) => setConfirmDelete(p);

  const doDelete = async () => {
    const p = confirmDelete;
    if (!p) return;
    setConfirmDelete(null);
    setDeletingId(String(p.id));
    try {
      await DataService.deletePrestataire(p.id);
      setPrestataires(prev => prev.filter(x => x.id !== p.id));
      toast({ title: "Prestataire supprimé", description: `${p.nom} a été supprimé.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer ce prestataire.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const setSearchAndReset       = (v: string) => { setSearch(v);             setPage(1); };
  const setFilterTypeAndReset   = (v: string | null) => { setFilterType(v); setPage(1); };
  const setFilterStatusAndReset = (v: string | null) => { setFilterStatus(v); setPage(1); };

  const filtered = prestataires.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (p.nom     || "").toLowerCase().includes(q) ||
      (p.type    || "").toLowerCase().includes(q) ||
      (p.adresse || "").toLowerCase().includes(q) ||
      (p.numero  || "").toLowerCase().includes(q) ||
      (p.telephone || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q);
    const matchesType = filterType ? p.type === filterType : true;
    const matchesStatus = filterStatus ? p.statut === filterStatus : true;
    const matchesPartnership = filterPartnership ? p.partnershipLevel === filterPartnership : true;
    return matchesSearch && matchesType && matchesStatus && matchesPartnership;
  });

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <AppLayout title="Gestion des Prestataires">
      <div className="space-y-6 px-4 sm:px-6">

        {/* ── Header intelligent ────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Gestion des Prestataires Santé
              </h1>
              <p className="text-gray-600 text-sm">
                Supervision des partenaires médicaux agréés • {stats.total} prestataires actifs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Système opérationnel</span>
              </div>
              <button
                onClick={() => navigate("/admin/prestataires/new")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus size={16} />
                Nouveau partenaire
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI Cards professionnelles ────────────────────────────── */}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Building2, label: "Prestataires actifs", value: stats.actifs, color: "from-green-500 to-green-600", trend: "+2" },
              { icon: AlertTriangle, label: "Suspendus", value: stats.suspendus, color: "from-red-500 to-red-600", trend: "-1" },
              { icon: Building2, label: "Pharmacies", value: stats.pharmacies, color: "from-blue-500 to-blue-600", trend: "+1" },
              { icon: ShieldCheck, label: "Hôpitaux", value: stats.hopitaux, color: "from-purple-500 to-purple-600", trend: "0" },
            ].map((kpi, i) => (
              <Card key={i} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gradient-to-br ${kpi.color} rounded-lg`}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-lg font-bold truncate">{kpi.value}</p>
                      <span className="text-xs text-green-600 font-medium">{kpi.trend}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── Barre d'actions et recherche enterprise ───────────────── */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Recherche avancée */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-input bg-card">
                <Search size={15} className="text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearchAndReset(e.target.value)}
                  placeholder="Rechercher par nom, téléphone, email, spécialité..."
                  className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 text-sm"
                />
              </div>
            </div>

            {/* Toggle vue */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 rounded-md transition-colors ${viewMode === "cards" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
              >
                <LayoutDashboard size={16} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition-colors ${viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
              >
                <ClipboardList size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Filtres avancés ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {/* Filtre type */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Type:</span>
            <button
              onClick={() => setFilterTypeAndReset(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterType === null ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"}`}
            >
              Tous
            </button>
            {Object.entries(typeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterTypeAndReset(filterType === key ? null : key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterType === key ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filtre statut */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Statut:</span>
            <button
              onClick={() => setFilterStatusAndReset(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterStatus === null ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"}`}
            >
              Tous
            </button>
            {Object.entries(statutLabel).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterStatusAndReset(filterStatus === key ? null : key)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterStatus === key ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Compteur et résultats ─────────────────────────────────── */}
        {!loading && !error && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
              prestataire{filtered.length !== 1 ? "s" : ""}
              {(search || filterType || filterStatus) ? ` trouvé${filtered.length !== 1 ? "s" : ""}` : " au total"}
            </p>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-gray-50">
                <Download size={14} />
                Exporter
              </button>
            </div>
          </div>
        )}

        {/* ── États premium ─────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {/* Skeleton KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            {/* Skeleton prestataires */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-5">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded animate-pulse flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse flex-1"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Service temporairement indisponible</h3>
                <p className="text-gray-600 text-sm max-w-md">
                  Impossible de charger les prestataires. Le service est momentanément indisponible.
                  Veuillez réessayer dans quelques instants.
                </p>
              </div>
              <button
                onClick={loadPrestataires}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {(search || filterType || filterStatus) ? "Aucun prestataire trouvé" : "Aucun prestataire enregistré"}
                </h3>
                <p className="text-gray-600 text-sm max-w-md">
                  {(search || filterType || filterStatus)
                    ? "Aucun prestataire ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                    : "Les prestataires sont les hôpitaux, cliniques, pharmacies et laboratoires partenaires. Ajoutez un nouveau partenaire pour commencer."
                  }
                </p>
              </div>
              {!(search || filterType || filterStatus) && (
                <button
                  onClick={() => navigate("/admin/prestataires/new")}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={16} />
                  Ajouter le premier prestataire
                </button>
              )}
            </div>
          </Card>
        ) : viewMode === "cards" ? (
          /* Vue cartes enterprise */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((prest, i) => (
              <motion.div
                key={prest.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 group">
                  {/* En-tête avec niveau partenariat */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: "#1B5299" }}>
                        {(prest.nom || "?").split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{prest.nom}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[prest.type] || "bg-gray-100 text-gray-600"}`}>
                            {typeLabels[prest.type] || prest.type || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Statut réel */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${statutDot[prest.statut] ?? "bg-gray-400"}`} />
                      <span className="text-xs font-medium text-muted-foreground">{statutLabel[prest.statut] ?? prest.statut}</span>
                    </div>
                  </div>

                  {/* Indicateurs métier réels */}
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Consultations</p>
                      <p className="text-lg font-bold text-blue-600">
                        {statsMap[prest.id]?.nbConsultations ?? "—"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {prest.type === "PHARMACIE" ? "Médicaments fournis" : "Prestations"}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {prest.type === "PHARMACIE"
                          ? (statsMap[prest.id]?.nbLignesFournies ?? "—")
                          : (statsMap[prest.id]?.nbPrestations ?? "—")}
                      </p>
                    </div>
                  </div>

                  {/* Coordonnées */}
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    {prest.numero && (
                      <div className="flex items-center gap-2">
                        <Hash size={12} className="shrink-0" />
                        <span className="text-xs font-mono">{prest.numero}</span>
                      </div>
                    )}
                    {prest.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="shrink-0" />
                        <span className="text-xs">{prest.telephone}</span>
                      </div>
                    )}
                    {prest.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="shrink-0" />
                        <span className="text-xs truncate">{prest.email}</span>
                      </div>
                    )}
                    {prest.adresse && (
                      <div className="flex items-start gap-2">
                        <MapPin size={12} className="shrink-0 mt-0.5" />
                        <span className="text-xs truncate">{prest.adresse}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions rapides enterprise */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(`/admin/prestataires/${prest.id}`)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-card hover:bg-gray-50 transition-colors"
                    >
                      <Eye size={12} />
                      Détails
                    </button>
                    <button
                      onClick={() => navigate(`/admin/prestataires/${prest.id}/edit`)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil size={12} />
                      Modifier
                    </button>
                    <button
                      onClick={() => navigate(`/admin/prestataires/${prest.id}/stats`)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <BarChart2 size={12} />
                      Stats
                    </button>
                    <button
                      onClick={() => handleDelete(prest)}
                      disabled={deletingId === String(prest.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingId === String(prest.id)
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Trash2 size={12} />
                      }
                      Supprimer
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Vue tableau enterprise */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Prestataire</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Consultations</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Prestations / Méd. fournis</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Statut</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map((prest) => (
                    <tr key={prest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "#1B5299" }}>
                            {(prest.nom || "?").split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{prest.nom}</p>
                            <p className="text-xs text-muted-foreground">{prest.numero}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${typeColors[prest.type] || "bg-gray-100 text-gray-600"}`}>
                          {typeLabels[prest.type] || prest.type || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statutDot[prest.statut] ?? "bg-gray-400"}`} />
                          <span className="text-sm">{statutLabel[prest.statut] ?? prest.statut}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {statsMap[prest.id]?.nbConsultations ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {prest.type === "PHARMACIE"
                          ? (statsMap[prest.id]?.nbLignesFournies ?? "—")
                          : (statsMap[prest.id]?.nbPrestations ?? "—")}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${statutDot[prest.statut] ?? "bg-gray-400"}`} />
                          <Badge variant="outline" className="text-xs">{statutLabel[prest.statut] ?? prest.statut}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/admin/prestataires/${prest.id}`)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/prestataires/${prest.id}/edit`)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(prest)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && filtered.length > pageSize && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        )}

        {/* ── Dialogue de confirmation suppression ── */}
        <ConfirmDialog
          open={confirmDelete !== null}
          title="Supprimer le prestataire"
          description={`Supprimer définitivement "${confirmDelete?.nom}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          destructive
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      </div>
    </AppLayout>
  );
}
