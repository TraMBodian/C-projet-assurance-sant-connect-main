import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote, RefreshCw, Plus, CheckCircle, Clock, AlertTriangle,
  X, Search, Download, Loader2,
} from "@/components/ui/Icons";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { DataService } from "@/services/dataService";
import {
  SkeletonList, ErrorBanner, EmptyState, KpiRow,
} from "@/components/client/ClientPageComponents";

// ─── Types ────────────────────────────────────────────────────────────────────

const STATUTS = {
  EN_ATTENTE: { label: "En attente", badge: "bg-yellow-100 text-yellow-700", icon: <Clock size={13} /> },
  PAYE:       { label: "Payé",       badge: "bg-green-100 text-green-700",   icon: <CheckCircle size={13} /> },
  EN_RETARD:  { label: "En retard",  badge: "bg-red-100 text-red-700",       icon: <AlertTriangle size={13} /> },
};

const MOYENS = ["Orange Money", "Wave", "Virement bancaire", "Chèque", "Espèces"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMontant(v: any) {
  const n = Number(v ?? 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k FCFA`;
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function nomAssure(p: any) {
  if (p.assure) return `${p.assure.prenom ?? ""} ${p.assure.nom ?? ""}`.trim();
  if (p.police?.assure) return `${p.police.assure.prenom ?? ""} ${p.police.assure.nom ?? ""}`.trim();
  return "—";
}

// ─── Modal : enregistrer paiement ─────────────────────────────────────────────

function ModalPayer({ paiement, onClose, onSuccess }: {
  paiement: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [moyen, setMoyen]   = useState("Orange Money");
  const [ref, setRef]       = useState("");
  const [notes, setNotes]   = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await DataService.payerPaiementPrime(String(paiement.id), {
        moyenPaiement:        moyen,
        referenceTransaction: ref || undefined,
        notes:                notes || undefined,
      });
      toast.success(`Paiement enregistré — ${paiement.periode} · ${fmtMontant(paiement.montant)}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{ scale: 0.95,    opacity: 0 }}
        className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-semibold text-base">Enregistrer le paiement</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{paiement.periode} · {fmtMontant(paiement.montant)}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Moyen de paiement *</label>
            <select
              value={moyen}
              onChange={e => setMoyen(e.target.value)}
              className="mt-1.5 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {MOYENS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Référence de transaction</label>
            <input
              value={ref}
              onChange={e => setRef(e.target.value)}
              placeholder="ex. OW-20250101-001"
              className="mt-1.5 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Remarques..."
              className="mt-1.5 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={submit} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Confirmer le paiement
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal : créer paiement ────────────────────────────────────────────────────

function ModalCreer({ polices, onClose, onSuccess }: {
  polices: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [policeId, setPoliceId]   = useState("");
  const [periode, setPeriode]     = useState("");
  const [montant, setMontant]     = useState("");
  const [echeance, setEcheance]   = useState("");
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);

  const submit = async () => {
    if (!policeId) { toast.error("Police requise"); return; }
    if (!periode)  { toast.error("Période requise"); return; }
    setSaving(true);
    try {
      await DataService.creerPaiementPrime({
        policeId: Number(policeId),
        periode,
        montant:      montant ? Number(montant) : undefined,
        dateEcheance: echeance ? new Date(echeance).toISOString().slice(0, 19) : undefined,
        notes:        notes || undefined,
      });
      toast.success(`Paiement créé — Période ${periode}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Impossible de créer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{ scale: 0.95,    opacity: 0 }}
        className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-base">Nouveau paiement de prime</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Police *</label>
            <select
              value={policeId}
              onChange={e => setPoliceId(e.target.value)}
              className="mt-1.5 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">Sélectionner une police…</option>
              {polices.map(p => (
                <option key={p.id} value={p.id}>
                  {p.numero} — {p.assure ? `${p.assure.prenom} ${p.assure.nom}` : "Sans assuré"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Période *</label>
            <input
              value={periode}
              onChange={e => setPeriode(e.target.value)}
              placeholder="ex. Janvier 2025"
              className="mt-1.5 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Montant (FCFA)</label>
              <input
                type="number"
                value={montant}
                onChange={e => setMontant(e.target.value)}
                placeholder="Auto depuis police"
                className="mt-1.5 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date d'échéance</label>
              <input
                type="date"
                value={echeance}
                onChange={e => setEcheance(e.target.value)}
                className="mt-1.5 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="mt-1.5 w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>Annuler</Button>
          <Button onClick={submit} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Créer
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

function exportCSV(paiements: any[]) {
  const header = "Numéro;Période;Assuré;Police;Montant;Statut;Moyen;Référence;Échéance;Date paiement";
  const rows = paiements.map(p => [
    p.numero ?? "",
    p.periode ?? "",
    nomAssure(p),
    p.police?.numero ?? "",
    p.montant ?? 0,
    p.statut ?? "",
    p.moyenPaiement ?? "",
    p.referenceTransaction ?? "",
    p.dateEcheance ? new Date(p.dateEcheance).toLocaleDateString("fr-FR") : "",
    p.datePaiement ? new Date(p.datePaiement).toLocaleDateString("fr-FR") : "",
  ].join(";"));
  const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "paiements-primes.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PaiementsPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === "admin";
  const isClient = user?.role === "client";

  const [paiements, setPaiements] = useState<any[]>([]);
  const [polices,   setPolices]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [search,    setSearch]    = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [modalPayer, setModalPayer]     = useState<any | null>(null);
  const [modalCreer, setModalCreer]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await DataService.getPaiementsPrimes();
      setPaiements(data);
      if (isAdmin) {
        const ps = await DataService.getPolices();
        setPolices(ps);
      }
    } catch (err: any) {
      setError(err?.message ?? "Impossible de charger les paiements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarquerRetard = async (p: any) => {
    try {
      await DataService.marquerEnRetardPaiement(String(p.id));
      toast.success(`Marqué en retard — ${p.periode}`);
      load();
    } catch (err: any) {
      toast.error(err?.message ?? "Une erreur est survenue.");
    }
  };

  const handleSupprimer = (p: any) => setConfirmDelete(p);

  const doDelete = async () => {
    const p = confirmDelete;
    setConfirmDelete(null);
    if (!p) return;
    try {
      await DataService.supprimerPaiementPrime(String(p.id));
      toast.success("Paiement supprimé");
      setPaiements(prev => prev.filter(x => x.id !== p.id));
    } catch (err: any) {
      toast.error(err?.message ?? "Impossible de supprimer.");
    }
  };

  // ── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = paiements.filter(p => {
    const matchStatut = filterStatut === "all" || p.statut === filterStatut;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (p.numero ?? "").toLowerCase().includes(q)
      || (p.periode ?? "").toLowerCase().includes(q)
      || nomAssure(p).toLowerCase().includes(q)
      || (p.police?.numero ?? "").toLowerCase().includes(q);
    return matchStatut && matchSearch;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total      = paiements.length;
  const payés      = paiements.filter(p => p.statut === "PAYE").length;
  const enAttente  = paiements.filter(p => p.statut === "EN_ATTENTE").length;
  const enRetard   = paiements.filter(p => p.statut === "EN_RETARD").length;
  const montantTotal = paiements
    .filter(p => p.statut === "PAYE")
    .reduce((s, p) => s + Number(p.montant ?? 0), 0);

  const kpis = [
    { label: "Total",      value: total,     color: "blue"   as const },
    { label: "Payés",      value: payés,     color: "green"  as const },
    { label: "En attente", value: enAttente, color: "yellow" as const },
    { label: "En retard",  value: enRetard,  color: "red"    as const },
  ];

  const filterPills = [
    { key: "all",        label: "Tous"       },
    { key: "EN_ATTENTE", label: "En attente" },
    { key: "PAYE",       label: "Payés"      },
    { key: "EN_RETARD",  label: "En retard"  },
  ];

  return (
    <AppLayout title={isClient ? "Mes Paiements" : "Paiements de primes"}>
      <div className="space-y-5 px-4 sm:px-6 py-5">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] text-white rounded-xl p-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/15">
                <Banknote size={22} />
              </div>
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-0.5">
                  {isClient ? "Espace client" : "Gestion financière"}
                </p>
                <h1 className="text-2xl font-bold leading-tight">
                  {isClient ? "Mes Paiements" : "Paiements de primes"}
                </h1>
                <p className="text-blue-100 text-sm mt-0.5">
                  {isClient
                    ? "Historique des cotisations de votre contrat."
                    : "Suivi des paiements de primes de tous les assurés."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <button onClick={() => setModalCreer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors">
                  <Plus size={13} /><span className="hidden sm:inline">Nouveau</span>
                </button>
              )}
              <button onClick={() => exportCSV(filtered)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors">
                <Download size={13} /><span className="hidden sm:inline">CSV</span>
              </button>
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

        {/* ── Montant encaissé ──────────────────────────────────────────────── */}
        {!loading && !error && payés > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <div>
              <p className="text-xs text-green-700 font-medium">Total encaissé</p>
              <p className="text-lg font-bold text-green-800">{fmtMontant(montantTotal)}</p>
            </div>
          </div>
        )}

        {/* ── Recherche + Filtres ───────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Période, assuré, police…"
                className="pl-10 pr-3 py-2 w-full border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-brand"
              />
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
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Info résultats ────────────────────────────────────────────────── */}
        {!loading && !error && filtered.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            paiement{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* ── États ────────────────────────────────────────────────────────── */}
        {loading && <SkeletonList count={4} cols={1} />}

        {!loading && error && <ErrorBanner message={error} onRetry={load} />}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={<Banknote size={28} />}
            title="Aucun paiement trouvé"
            description={isClient
              ? "Aucun paiement de prime n'est enregistré pour votre contrat."
              : "Aucun paiement ne correspond aux filtres sélectionnés."}
            action={isAdmin ? (
              <Button size="sm" onClick={() => setModalCreer(true)} className="gap-1.5">
                <Plus size={14} />
                Créer le premier paiement
              </Button>
            ) : undefined}
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Tableau desktop */}
            <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">N° / Période</th>
                    {isAdmin && <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assuré</th>}
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Police</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Montant</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Échéance</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Paiement</th>
                    {isAdmin && <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const cfg    = STATUTS[p.statut as keyof typeof STATUTS] ?? STATUTS.EN_ATTENTE;
                    const isPaid = p.statut === "PAYE";
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <p className="font-mono text-xs text-muted-foreground">{p.numero}</p>
                          <p className="font-medium text-sm">{p.periode}</p>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-sm truncate max-w-[180px]">{nomAssure(p)}</td>
                        )}
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {p.police?.numero ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-blue-600 whitespace-nowrap">
                          {fmtMontant(p.montant)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          {p.moyenPaiement && (
                            <p className="text-xs text-muted-foreground mt-0.5">{p.moyenPaiement}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                          {fmtDate(p.dateEcheance)}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                          {isPaid ? fmtDate(p.datePaiement) : "—"}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isPaid && (
                                <Button
                                  size="sm" variant="outline"
                                  className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                                  onClick={() => setModalPayer(p)}
                                >
                                  <CheckCircle size={12} /> Payer
                                </Button>
                              )}
                              {p.statut === "EN_ATTENTE" && (
                                <Button
                                  size="sm" variant="ghost"
                                  className="h-7 text-xs text-orange-600 hover:bg-orange-50"
                                  title="Marquer en retard"
                                  onClick={() => handleMarquerRetard(p)}
                                >
                                  <AlertTriangle size={12} />
                                </Button>
                              )}
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                title="Supprimer"
                                onClick={() => handleSupprimer(p)}
                              >
                                <X size={13} />
                              </Button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cartes mobile */}
            <div className="md:hidden space-y-3">
              {filtered.map((p, i) => {
                const cfg    = STATUTS[p.statut as keyof typeof STATUTS] ?? STATUTS.EN_ATTENTE;
                const isPaid = p.statut === "PAYE";
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-xl border border-border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{p.periode}</p>
                        <p className="font-mono text-xs text-muted-foreground">{p.numero}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Montant</p>
                        <p className="font-semibold text-blue-600 text-sm">{fmtMontant(p.montant)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Police</p>
                        <p className="font-mono">{p.police?.numero ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Échéance</p>
                        <p>{fmtDate(p.dateEcheance)}</p>
                      </div>
                      {isPaid && (
                        <div>
                          <p className="text-muted-foreground">Payé le</p>
                          <p>{fmtDate(p.datePaiement)}</p>
                        </div>
                      )}
                    </div>

                    {isAdmin && !isPaid && (
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm" variant="outline"
                          className="flex-1 text-green-600 border-green-200 hover:bg-green-50 gap-1"
                          onClick={() => setModalPayer(p)}
                        >
                          <CheckCircle size={13} /> Enregistrer paiement
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalPayer && (
          <ModalPayer
            paiement={modalPayer}
            onClose={() => setModalPayer(null)}
            onSuccess={load}
          />
        )}
        {modalCreer && isAdmin && (
          <ModalCreer
            polices={polices}
            onClose={() => setModalCreer(false)}
            onSuccess={load}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer le paiement"
        description={`Supprimer définitivement le paiement "${confirmDelete?.numero}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        destructive
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </AppLayout>
  );
}
