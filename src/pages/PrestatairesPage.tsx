import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MapPin, Phone, Mail, Loader2, AlertCircle, Building2, Pencil, Trash2, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

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

export default function PrestatairesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [prestataires, setPrestataires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPrestataires = () => {
    setLoading(true);
    setError(false);
    DataService.getPrestataires()
      .then((data) => setPrestataires(data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPrestataires(); }, []);

  const handleDelete = async (p: any) => {
    if (!confirm(`Supprimer "${p.nom}" ? Cette action est irréversible.`)) return;
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

  const filtered = prestataires.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (p.nom     || "").toLowerCase().includes(q) ||
      (p.type    || "").toLowerCase().includes(q) ||
      (p.adresse || "").toLowerCase().includes(q) ||
      (p.numero  || "").toLowerCase().includes(q);
    const matchesType = filterType ? p.type === filterType : true;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout title="Gestion des Prestataires">
      <div className="space-y-4 sm:space-y-5">

        {/* ── Barre d'actions ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-input bg-card">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom, type, adresse, numéro..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => navigate("/prestataires/new")}
            className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium shadow-sm hover:shadow-md active:scale-95 transition-all duration-150 whitespace-nowrap shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Nouveau prestataire</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
        </div>

        {/* ── Filtres par type ───────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterType === null ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:border-foreground/40"}`}
          >
            Tous
          </button>
          {Object.entries(typeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterType(filterType === key ? null : key)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filterType === key ? typeColors[key] + " border-transparent" : "bg-card border-border text-muted-foreground hover:border-foreground/40"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Compteur ───────────────────────────────────────────────── */}
        {!loading && !error && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            prestataire{filtered.length !== 1 ? "s" : ""}
            {(search || filterType) ? ` trouvé${filtered.length !== 1 ? "s" : ""}` : " au total"}
          </p>
        )}

        {/* ── États ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-4">
            <AlertCircle size={36} className="text-destructive opacity-60" />
            <p className="font-medium text-sm">Impossible de charger les prestataires</p>
            <p className="text-xs text-muted-foreground">Service temporairement indisponible</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <Building2 size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold">{(search || filterType) ? "Aucun prestataire trouvé" : "Aucun prestataire enregistré"}</p>
            {!(search || filterType) && (
              <p className="text-sm text-muted-foreground max-w-sm">
                Les prestataires sont les hôpitaux, cliniques, pharmacies et laboratoires partenaires.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((prest, i) => (
              <motion.div
                key={prest.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-4 sm:p-5 border border-border hover:shadow-md transition-shadow group"
              >
                {/* En-tête */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {(prest.nom || "?").split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{prest.nom}</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 font-medium ${typeColors[prest.type] || "bg-gray-100 text-gray-600"}`}>
                        {typeLabels[prest.type] || prest.type || "—"}
                      </span>
                    </div>
                  </div>
                  {/* Statut */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${statutDot[prest.statut] ?? "bg-gray-400"}`} />
                      <span className="text-xs text-muted-foreground">{statutLabel[prest.statut] ?? prest.statut}</span>
                    </div>
                  </div>
                </div>

                {/* Numéro */}
                {prest.numero && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash size={11} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground font-mono">{prest.numero}</span>
                  </div>
                )}

                {/* Coordonnées */}
                <div className="space-y-1.5 text-sm text-muted-foreground">
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

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => navigate(`/prestataires/${prest.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted transition-colors"
                  >
                    <Pencil size={12} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(prest)}
                    disabled={deletingId === String(prest.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === String(prest.id)
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />
                    }
                    Supprimer
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
