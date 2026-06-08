import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, CheckCircle, Clock, XCircle,
  X, Loader2, ChevronDown, ChevronUp, Search, RefreshCw,
} from "@/components/ui/Icons";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  SkeletonList, ErrorBanner, EmptyState, StatusBadge, KpiRow,
} from "@/components/client/ClientPageComponents";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

const STATUT_ICON: Record<string, React.ReactNode> = {
  EN_ATTENTE: <Clock size={12} />,
  APPROUVE:   <CheckCircle size={12} />,
  APPLIQUE:   <CheckCircle size={12} />,
  REFUSE:     <XCircle size={12} />,
};

const TYPE_LABELS: Record<string, string> = {
  MODIFICATION_COUVERTURE: "Modification de couverture",
  AJOUT_BENEFICIAIRE:      "Ajout / retrait de bénéficiaire",
  MODIFICATION_ADRESSE:    "Modification d'adresse",
  MODIFICATION_PRIME:      "Modification de prime",
  PROLONGATION:            "Prolongation du contrat",
  AUTRE:                   "Autre modification",
};

// ─── Modal traitement (admin) ─────────────────────────────────────────────────

function ModalTraitement({
  avenant, action, onClose, onDone,
}: { avenant: any; action: "approuver" | "refuser"; onClose: () => void; onDone: () => void }) {
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);
  const isApprouver = action === "approuver";

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (isApprouver) {
        await DataService.approuverAvenantContrat(String(avenant.id), commentaire);
        toast.success("Avenant approuvé et appliqué sur la police");
      } else {
        await DataService.refuserAvenantContrat(String(avenant.id), commentaire);
        toast.success("Avenant refusé");
      }
      onDone();
    } catch {
      toast.error("Une erreur est survenue");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md"
        >
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className={`font-semibold text-lg ${isApprouver ? "text-green-700" : "text-red-700"}`}>
              {isApprouver ? "Approuver l'avenant" : "Refuser l'avenant"}
            </h2>
            <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
          </div>

          <div className="p-5 space-y-4">
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">N° avenant :</span> <span className="font-mono font-semibold">{avenant.numero}</span></p>
              <p><span className="text-muted-foreground">Police :</span> <span className="font-mono">{avenant.policeNumero}</span></p>
              <p><span className="text-muted-foreground">Assuré :</span> {avenant.assureNom || avenant.assureEmail}</p>
              <p><span className="text-muted-foreground">Type :</span> {TYPE_LABELS[avenant.type] ?? avenant.type}</p>
              {avenant.ancienneValeur && <p><span className="text-muted-foreground">Actuelle :</span> {avenant.ancienneValeur}</p>}
              {avenant.nouvelleValeur && <p><span className="text-muted-foreground">Nouvelle :</span> <span className="font-semibold">{avenant.nouvelleValeur}</span></p>}
            </div>

            {isApprouver && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800">
                L'approbation appliquera automatiquement la modification sur la police.
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">Commentaire (facultatif)</label>
              <textarea
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                rows={3}
                placeholder={isApprouver ? "Message pour le client..." : "Motif du refus..."}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 p-5 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
            <Button
              variant={isApprouver ? "default" : "destructive"}
              onClick={handleSubmit}
              disabled={saving}
              className="gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isApprouver ? "Approuver" : "Refuser"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Carte avenant ────────────────────────────────────────────────────────────

function AvenantCard({
  a, isAdmin, onTraiter, onDelete,
}: { a: any; isAdmin: boolean; onTraiter?: (a: any, action: "approuver" | "refuser") => void; onDelete?: (a: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isPending = a.statut === "EN_ATTENTE";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={16} className="text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{TYPE_LABELS[a.type] ?? a.type}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {a.numero} · Police {a.policeNumero}
                </p>
              </div>
            </div>
            <StatusBadge status={a.statut ?? "EN_ATTENTE"} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
            {isAdmin && <span className="col-span-2">Assuré : <span className="text-foreground font-medium">{a.assureNom || a.assureEmail}</span></span>}
            <span>Soumis le : <span className="text-foreground">{fmtDate(a.createdAt)}</span></span>
            {a.traiteAt && <span>Traité le : <span className="text-foreground">{fmtDate(a.traiteAt)}</span></span>}
            {a.ancienneValeur && (
              <span className="col-span-2">
                <span className="text-muted-foreground">Actuelle :</span> {a.ancienneValeur}
                {a.nouvelleValeur && <> → <span className="text-foreground font-semibold">{a.nouvelleValeur}</span></>}
              </span>
            )}
          </div>

          {(a.description || a.commentaireAdmin) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Masquer les détails" : "Voir les détails"}
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-2">
              {a.description && (
                <div className="rounded bg-muted/50 px-3 py-2 text-xs">
                  <p className="font-semibold text-muted-foreground mb-0.5">Description</p>
                  <p>{a.description}</p>
                </div>
              )}
              {a.commentaireAdmin && (
                <div className="rounded bg-purple-50 px-3 py-2 text-xs">
                  <p className="font-semibold text-purple-600 mb-0.5">Commentaire gestionnaire</p>
                  <p className="text-purple-800">{a.commentaireAdmin}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {isAdmin && isPending && (
          <div className="flex border-t divide-x">
            <button
              onClick={() => onTraiter?.(a, "approuver")}
              className="flex-1 py-2.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition-colors"
            >
              <CheckCircle size={13} className="inline mr-1" />
              Approuver & Appliquer
            </button>
            <button
              onClick={() => onTraiter?.(a, "refuser")}
              className="flex-1 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <XCircle size={13} className="inline mr-1" />
              Refuser
            </button>
          </div>
        )}

        {isAdmin && !isPending && (
          <div className="flex border-t">
            <button
              onClick={() => onDelete?.(a)}
              className="w-full py-2.5 text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
            >
              Supprimer
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

const FILTERS = [
  { key: "all",        label: "Tous"        },
  { key: "EN_ATTENTE", label: "En attente"  },
  { key: "APPLIQUE",   label: "Appliqués"   },
  { key: "REFUSE",     label: "Refusés"     },
] as const;

export default function AvenantsContratPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [avenants, setAvenants]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState("all");
  const [search, setSearch]             = useState("");
  const [modal, setModal]               = useState<{ avenant: any; action: "approuver" | "refuser" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await DataService.getAvenantsContrat();
      setAvenants(data);
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger les avenants.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (a: any) => setConfirmDelete(a);

  const doDelete = async () => {
    const a = confirmDelete;
    setConfirmDelete(null);
    if (!a) return;
    try {
      await DataService.supprimerAvenantContrat(String(a.id));
      setAvenants(prev => prev.filter(x => x.id !== a.id));
      toast.success("Avenant supprimé");
    } catch { toast.error("Impossible de supprimer"); }
  };

  const filtered = avenants.filter(a => {
    const matchStatut = filterStatut === "all" || a.statut === filterStatut ||
      (filterStatut === "APPLIQUE" && (a.statut === "APPROUVE" || a.statut === "APPLIQUE"));
    const q = search.toLowerCase();
    const matchSearch = !q
      || (a.policeNumero ?? "").toLowerCase().includes(q)
      || (TYPE_LABELS[a.type] ?? "").toLowerCase().includes(q)
      || (a.statut ?? "").toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  const counts = {
    total:    avenants.length,
    attente:  avenants.filter(a => a.statut === "EN_ATTENTE").length,
    applique: avenants.filter(a => a.statut === "APPLIQUE" || a.statut === "APPROUVE").length,
    refuse:   avenants.filter(a => a.statut === "REFUSE").length,
  };

  const filterPills = [
    { key: "all",        label: "Tous",       count: counts.total   },
    { key: "EN_ATTENTE", label: "En attente", count: counts.attente  },
    { key: "APPLIQUE",   label: "Appliqués",  count: counts.applique },
    { key: "REFUSE",     label: "Refusés",    count: counts.refuse   },
  ];

  const kpis = [
    { label: "Total",      value: counts.total,    color: "blue"   as const },
    { label: "En attente", value: counts.attente,  color: "yellow" as const },
    { label: "Appliqués",  value: counts.applique, color: "green"  as const },
    { label: "Refusés",    value: counts.refuse,   color: "red"    as const },
  ];

  return (
    <AppLayout title={isAdmin ? "Avenants au contrat" : "Mes Avenants"}>
      {modal && (
        <ModalTraitement
          avenant={modal.avenant}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(); }}
        />
      )}

      <div className="space-y-5 px-4 sm:px-6 py-5">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] text-white rounded-xl p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/15">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-0.5">
                  {isAdmin ? "Gestion des contrats" : "Espace client"}
                </p>
                <h1 className="text-2xl font-bold leading-tight">
                  {isAdmin ? "Avenants au contrat" : "Mes Avenants"}
                </h1>
                <p className="text-blue-100 text-sm mt-0.5">
                  {isAdmin
                    ? "Gérez les demandes de modification de contrat des assurés."
                    : "Suivez vos demandes de modification de contrat d'assurance."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={load} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors disabled:opacity-50">
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI cards ─────────────────────────────────────────────────────── */}
        {!loading && !error && <KpiRow items={kpis} />}

        {/* ── Recherche + Filtres ───────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Police, type, statut…"
                className="pl-10 pr-9 py-2 w-full border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {filterPills.map(pill => (
                <button
                  key={pill.key}
                  onClick={() => setFilterStatut(pill.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${
                    filterStatut === pill.key
                      ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"
                  }`}
                >
                  {pill.label}
                  {pill.count > 0 && (
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                      filterStatut === pill.key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                      {pill.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* États */}
        {loading && <SkeletonList count={3} cols={2} />}

        {!loading && error && <ErrorBanner message={error} onRetry={load} />}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<FileText size={28} />}
            title="Aucun avenant"
            description={filterStatut === "all"
              ? isAdmin
                ? "Aucune demande d'avenant n'a encore été soumise."
                : "Vous n'avez pas encore soumis d'avenant. Utilisez le bouton « Avenant » depuis vos polices."
              : "Aucun avenant dans cette catégorie."}
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <AvenantCard
                  a={a}
                  isAdmin={isAdmin}
                  onTraiter={(av, action) => setModal({ avenant: av, action })}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </div>
        )}

      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer l'avenant"
        description="Supprimer définitivement cet avenant ? Cette action est irréversible."
        confirmLabel="Supprimer"
        destructive
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </AppLayout>
  );
}
