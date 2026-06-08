import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, CheckCircle, Clock, XCircle, X, Loader2,
  ChevronDown, ChevronUp, Ban, Search, AlertCircle, FileText, Plus,
} from "@/components/ui/Icons";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { SkeletonList, KpiRow } from "@/components/client/ClientPageComponents";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

const STATUT_CFG: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  EN_ATTENTE: { label: "En attente", badge: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3" />        },
  APPROUVEE:  { label: "Approuvée",  badge: "bg-green-100 text-green-700",   icon: <CheckCircle className="w-3 h-3" />  },
  REFUSEE:    { label: "Refusée",    badge: "bg-red-100 text-red-700",       icon: <XCircle className="w-3 h-3" />      },
};

const TYPE_CFG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  RENOUVELLEMENT: { label: "Renouvellement", icon: <RefreshCw className="w-4 h-4" />, color: "text-blue-600"  },
  RESILIATION:    { label: "Résiliation",    icon: <Ban className="w-4 h-4" />,        color: "text-red-600"   },
};

const FILTERS = ["all", "EN_ATTENTE", "APPROUVEE", "REFUSEE"] as const;
type FilterKey = typeof FILTERS[number];

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Toutes", EN_ATTENTE: "En attente", APPROUVEE: "Approuvées", REFUSEE: "Refusées",
};

// ─── Modal traitement admin ────────────────────────────────────────────────────

function ModalTraitement({
  demande, action, onClose, onDone,
}: { demande: any; action: "approuver" | "refuser"; onClose: () => void; onDone: () => void }) {
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);
  const isApprouver = action === "approuver";

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (isApprouver) {
        await DataService.approuverDemandeContrat(String(demande.id), commentaire);
        toast.success("Demande approuvée");
      } else {
        await DataService.refuserDemandeContrat(String(demande.id), commentaire);
        toast.success("Demande refusée");
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
              {isApprouver ? "Approuver la demande" : "Refuser la demande"}
            </h2>
            <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
          </div>

          <div className="p-5 space-y-4">
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Police :</span> <span className="font-mono font-semibold">{demande.policeNumero}</span></p>
              <p><span className="text-muted-foreground">Assuré :</span> {demande.assureNom || demande.assureEmail}</p>
              <p><span className="text-muted-foreground">Type :</span> {TYPE_CFG[demande.type]?.label ?? demande.type}</p>
              {demande.motif && <p><span className="text-muted-foreground">Motif :</span> {demande.motif}</p>}
            </div>
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

// ─── Ligne expandable (détails) ───────────────────────────────────────────────

function ExpandedDetails({ d }: { d: any }) {
  return (
    <div className="mt-2 space-y-1.5">
      {d.notes && (
        <div className="rounded bg-muted/50 px-3 py-2 text-xs">
          <p className="font-semibold text-muted-foreground mb-0.5">Notes client</p>
          <p>{d.notes}</p>
        </div>
      )}
      {d.commentaireAdmin && (
        <div className="rounded bg-blue-50 px-3 py-2 text-xs">
          <p className="font-semibold text-blue-600 mb-0.5">Commentaire gestionnaire</p>
          <p className="text-blue-800">{d.commentaireAdmin}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemandesContratPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [demandes, setDemandes]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState<FilterKey>("all");
  const [expanded, setExpanded]           = useState<number | null>(null);
  const [modal, setModal]                 = useState<{ demande: any; action: "approuver" | "refuser" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  const load = async () => {
    setLoading(true); setError(false);
    try {
      const data = await DataService.getDemandesContrat();
      setDemandes(data ?? []);
    } catch {
      setError(true);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (d: any) => setConfirmDelete(d);

  const doDelete = async () => {
    const d = confirmDelete;
    setConfirmDelete(null);
    if (!d) return;
    try {
      await DataService.supprimerDemandeContrat(String(d.id));
      setDemandes(prev => prev.filter(x => x.id !== d.id));
      toast.success("Demande supprimée");
    } catch { toast.error("Impossible de supprimer"); }
  };

  // Filtrage
  const filtered = demandes.filter(d => {
    const matchFilter = filter === "all" || d.statut === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (d.policeNumero ?? "").toLowerCase().includes(q)
      || (d.assureNom ?? "").toLowerCase().includes(q)
      || (d.assureEmail ?? "").toLowerCase().includes(q)
      || (TYPE_CFG[d.type]?.label ?? "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    total:     demandes.length,
    attente:   demandes.filter(d => d.statut === "EN_ATTENTE").length,
    approuvee: demandes.filter(d => d.statut === "APPROUVEE").length,
    refusee:   demandes.filter(d => d.statut === "REFUSEE").length,
  };

  return (
    <AppLayout title={isAdmin ? "Demandes de contrat" : "Mes Demandes"}>
      {modal && (
        <ModalTraitement
          demande={modal.demande}
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
                  {isAdmin ? "Demandes de contrat" : "Mes Demandes"}
                </h1>
                <p className="text-blue-100 text-sm mt-0.5">
                  {isAdmin
                    ? "Gérez les demandes de renouvellement et de résiliation des assurés."
                    : "Suivez vos demandes de renouvellement et de résiliation de contrat."}
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
        {!loading && !error && (
          <KpiRow items={[
            { label: "Total",      value: counts.total,     color: "blue"   },
            { label: "En attente", value: counts.attente,   color: "yellow" },
            { label: "Approuvées", value: counts.approuvee, color: "green"  },
            { label: "Refusées",   value: counts.refusee,   color: "red"    },
          ]} />
        )}

        {/* ── Recherche + Filtres ───────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isAdmin ? "Police, assuré, type…" : "Police, type…"}
                className="pl-10 pr-9 py-2 w-full border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(key => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${
                    filter === key
                      ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"
                  }`}
                >
                  {FILTER_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Compteur ──────────────────────────────────────────────────────── */}
        {!loading && !error && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            demande{filtered.length !== 1 ? "s" : ""}
            {(search || filter !== "all") ? " trouvée" + (filtered.length !== 1 ? "s" : "") : " au total"}
          </p>
        )}

        {/* ── États ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : error ? (
          <Card className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="font-medium text-sm text-red-600">Impossible de charger les demandes</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={load}>Réessayer</Button>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <RefreshCw size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold">
              {search || filter !== "all" ? "Aucune demande ne correspond" : "Aucune demande enregistrée"}
            </p>
            {!isAdmin && !search && filter === "all" && (
              <p className="text-sm text-muted-foreground max-w-xs">
                Utilisez les boutons <span className="font-semibold">Renouveler</span> ou <span className="font-semibold">Résilier</span> depuis vos polices pour soumettre une demande.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* ── Tableau desktop ──────────────────────────────────── */}
            <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Police</th>
                    {isAdmin && <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assuré</th>}
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Soumis le</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Début souhaité</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const statut  = STATUT_CFG[d.statut] ?? STATUT_CFG.EN_ATTENTE;
                    const tc      = TYPE_CFG[d.type] ?? { label: d.type, icon: null, color: "text-muted-foreground" };
                    const isPending = d.statut === "EN_ATTENTE";
                    const isExpanded = expanded === d.id;

                    return (
                      <motion.tr
                        key={d.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors align-top"
                      >
                        <td className="py-3 px-4">
                          <div className={`flex items-center gap-1.5 font-medium ${tc.color}`}>
                            {tc.icon}
                            <span>{tc.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {d.policeNumero ?? "—"}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-sm truncate max-w-[160px]">
                            {d.assureNom || d.assureEmail || "—"}
                          </td>
                        )}
                        <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                          {fmtDate(d.createdAt)}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                          {d.dateDebutSouhaitee ? fmtDate(d.dateDebutSouhaitee) : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statut.badge}`}>
                            {statut.icon} {statut.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(d.notes || d.commentaireAdmin) && (
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 text-xs text-muted-foreground gap-1"
                                onClick={() => setExpanded(isExpanded ? null : d.id)}
                              >
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                Détails
                              </Button>
                            )}
                            {isAdmin && isPending && (
                              <>
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50"
                                  onClick={() => setModal({ demande: d, action: "approuver" })}
                                >
                                  <CheckCircle size={12} /> Approuver
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                  onClick={() => setModal({ demande: d, action: "refuser" })}
                                >
                                  <XCircle size={12} /> Refuser
                                </Button>
                              </>
                            )}
                            {isAdmin && !isPending && (
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                title="Supprimer"
                                onClick={() => handleDelete(d)}
                              >
                                <X size={13} />
                              </Button>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="mt-2 text-left">
                              <ExpandedDetails d={d} />
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Cartes mobile ────────────────────────────────────── */}
            <div className="md:hidden space-y-3">
              {filtered.map((d, i) => {
                const statut    = STATUT_CFG[d.statut] ?? STATUT_CFG.EN_ATTENTE;
                const tc        = TYPE_CFG[d.type] ?? { label: d.type, icon: null, color: "text-muted-foreground" };
                const isPending = d.statut === "EN_ATTENTE";
                const isExpanded = expanded === d.id;

                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-xl border border-border p-4 space-y-3"
                  >
                    {/* Ligne 1 : icône + type + badge */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        d.type === "RESILIATION" ? "bg-red-100" : "bg-blue-100"
                      }`}>
                        <span className={tc.color}>{tc.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{tc.label}</p>
                        <p className="font-mono text-xs text-muted-foreground">Police {d.policeNumero ?? "—"}</p>
                        {isAdmin && (d.assureNom || d.assureEmail) && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {d.assureNom || d.assureEmail}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statut.badge}`}>
                        {statut.icon} {statut.label}
                      </span>
                    </div>

                    {/* Ligne 2 : détails */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Soumis le</p>
                        <p className="font-medium">{fmtDate(d.createdAt)}</p>
                      </div>
                      {d.dateDebutSouhaitee && (
                        <div>
                          <p className="text-muted-foreground">Début souhaité</p>
                          <p className="font-medium">{fmtDate(d.dateDebutSouhaitee)}</p>
                        </div>
                      )}
                      {d.dureeAns && (
                        <div>
                          <p className="text-muted-foreground">Durée</p>
                          <p className="font-medium">{d.dureeAns} an{d.dureeAns > 1 ? "s" : ""}</p>
                        </div>
                      )}
                      {d.motif && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Motif</p>
                          <p className="font-medium">{d.motif}</p>
                        </div>
                      )}
                      {d.traiteeAt && (
                        <div>
                          <p className="text-muted-foreground">Traité le</p>
                          <p className="font-medium">{fmtDate(d.traiteeAt)}</p>
                        </div>
                      )}
                    </div>

                    {/* Notes / commentaire */}
                    {(d.notes || d.commentaireAdmin) && (
                      <>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : d.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {isExpanded ? "Masquer les détails" : "Voir les détails"}
                        </button>
                        {isExpanded && <ExpandedDetails d={d} />}
                      </>
                    )}

                    {/* Actions admin */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        {isPending ? (
                          <>
                            <Button
                              size="sm" variant="outline"
                              className="flex-1 text-green-700 border-green-200 hover:bg-green-50 gap-1"
                              onClick={() => setModal({ demande: d, action: "approuver" })}
                            >
                              <CheckCircle size={13} /> Approuver
                            </Button>
                            <Button
                              size="sm" variant="outline"
                              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 gap-1"
                              onClick={() => setModal({ demande: d, action: "refuser" })}
                            >
                              <XCircle size={13} /> Refuser
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm" variant="ghost"
                            className="text-muted-foreground hover:bg-muted/40 text-xs"
                            onClick={() => handleDelete(d)}
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer la demande"
        description="Supprimer définitivement cette demande de contrat ? Cette action est irréversible."
        confirmLabel="Supprimer"
        destructive
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </AppLayout>
  );
}
