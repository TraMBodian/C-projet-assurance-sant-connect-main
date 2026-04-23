import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Banknote, CheckCircle, Clock, TrendingUp,
  Loader2, AlertCircle, Download, FileText,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
                   "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function fmtMontant(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}k`;
  return String(val);
}

function assureNom(s: any): string {
  return s.assure ? `${s.assure.nom} ${s.assure.prenom}` : "—";
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

function exportCSV(rows: any[]) {
  const header = ["Numéro", "Assuré", "Date", "Réclamé (F)", "Remboursé (F)", "Statut"];
  const lines  = rows.map(s => [
    s.numero ?? "",
    assureNom(s),
    s.dateSinistre ? new Date(s.dateSinistre).toLocaleDateString("fr-FR") : "",
    s.montantReclamation ?? "",
    s.montantAccorde ?? "",
    s.statut ?? "",
  ]);
  const csv = [header, ...lines]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `remboursements_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function RemboursementsPage() {
  const [search,    setSearch]    = useState("");
  const [sinistres, setSinistres] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [showChart, setShowChart] = useState(true);

  useEffect(() => {
    DataService.getSinistres()
      .then((list) => setSinistres(list ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const remboursements = useMemo(
    () => sinistres.filter(s => s.statut === "PAYE" || s.statut === "APPROUVE"),
    [sinistres]
  );

  const filtered = remboursements.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.numero || "").toLowerCase().includes(q) ||
      assureNom(s).toLowerCase().includes(q)
    );
  });

  // ── Totaux ──────────────────────────────────────────────────────────────────

  const totalPaye   = sinistres.filter(s => s.statut === "PAYE").reduce((a, s) => a + Number(s.montantAccorde ?? 0), 0);
  const enCours     = sinistres.filter(s => s.statut === "APPROUVE").length;
  const effectues   = sinistres.filter(s => s.statut === "PAYE").length;

  // ── Graphique mensuel (12 derniers mois) ────────────────────────────────────

  const chartData = useMemo(() => {
    const now   = new Date();
    const slots = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { mois: MONTHS_FR[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), reclame: 0, rembourse: 0 };
    });
    remboursements.forEach(s => {
      if (!s.dateSinistre) return;
      const d = new Date(s.dateSinistre);
      const slot = slots.find(sl => sl.year === d.getFullYear() && sl.month === d.getMonth());
      if (!slot) return;
      slot.reclame   += Number(s.montantReclamation ?? 0);
      slot.rembourse += Number(s.montantAccorde ?? 0);
    });
    return slots.map(({ mois, reclame, rembourse }) => ({ mois, reclame, rembourse }));
  }, [remboursements]);

  const statusConfig: Record<string, { style: string; icon: React.ReactNode; label: string; payment?: string }> = {
    PAYE:    { style: "bg-green-100 text-green-700 border-green-200", icon: <CheckCircle size={13} />, label: "Payé",     payment: "Orange Money / Wave" },
    APPROUVE:{ style: "bg-blue-100 text-blue-700 border-blue-200",   icon: <Clock size={13} />,       label: "Approuvé", payment: "Virement en cours" },
  };

  return (
    <AppLayout title="Suivi des Remboursements">
      <div className="space-y-4 sm:space-y-5">

        {/* ── Compteurs ──────────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Payés",           value: effectues, bg: "bg-green-50",  border: "border-green-200",  iconBg: "bg-green-600",  num: "text-green-900",  sub: "text-green-700",  icon: <CheckCircle size={15} />, fmt: false },
              { label: "Approuvés",       value: enCours,   bg: "bg-blue-50",   border: "border-blue-200",   iconBg: "bg-blue-600",   num: "text-blue-900",   sub: "text-blue-700",   icon: <Clock size={15} />,       fmt: false },
              { label: "Total remboursé", value: totalPaye, bg: "bg-purple-50", border: "border-purple-200", iconBg: "bg-purple-600", num: "text-purple-900", sub: "text-purple-700", icon: <TrendingUp size={15} />,  fmt: true  },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${c.iconBg} rounded-lg flex items-center justify-center text-white shrink-0`}>
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-base sm:text-xl font-bold ${c.num} leading-none truncate`}>
                    {c.fmt ? `${fmtMontant(c.value)} F` : c.value}
                  </p>
                  <p className={`text-xs ${c.sub} truncate mt-0.5`}>{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Graphique 6 mois ───────────────────────────────────────── */}
        {!loading && !error && remboursements.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Réclamé vs Remboursé</h3>
                <p className="text-xs text-muted-foreground mt-0.5">6 derniers mois (FCFA)</p>
              </div>
              <button
                onClick={() => setShowChart(v => !v)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showChart ? "Masquer" : "Afficher"}
              </button>
            </div>
            {showChart && (
              <div className="h-44 sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => fmtMontant(Number(v))} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      formatter={(val: number) => [`${val.toLocaleString("fr-FR")} F`]}
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Bar dataKey="reclame"   name="Réclamé"     fill="#3B82F6" radius={[4,4,0,0]} maxBarSize={36} />
                    <Bar dataKey="rembourse" name="Remboursé"   fill="#10B981" radius={[4,4,0,0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ── Barre recherche + export ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 sm:max-w-sm">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-input bg-card">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 text-sm"
              />
            </div>
          </div>
          {filtered.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => exportCSV(filtered)}
            >
              <Download size={14} />
              Exporter CSV
            </Button>
          )}
        </div>

        {/* ── États ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-4">
            <AlertCircle size={36} className="text-destructive opacity-60" />
            <p className="font-medium text-sm">Impossible de charger les données</p>
            <p className="text-xs text-muted-foreground">Service temporairement indisponible</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <Banknote size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold">{search ? "Aucun résultat" : "Aucun remboursement enregistré"}</p>
            {!search && (
              <p className="text-sm text-muted-foreground max-w-sm">
                Les remboursements apparaissent ici lorsque des sinistres sont approuvés ou payés.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s, i) => {
              const cfg = statusConfig[s.statut] ?? statusConfig.APPROUVE;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl p-4 sm:p-5 border border-border hover:shadow-md transition-shadow"
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center text-white shrink-0">
                        <Banknote size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate text-sm sm:text-base">{assureNom(s)}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{s.numero}</p>
                        {s.police && (
                          <p className="text-xs text-muted-foreground truncate">Police : {s.police.numero}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium shrink-0 whitespace-nowrap ${cfg.style}`}>
                      {cfg.icon}
                      <span>{cfg.label}</span>
                    </span>
                  </div>

                  {/* Montants */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t pt-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Date</p>
                      <p className="font-medium text-xs sm:text-sm mt-0.5">
                        {s.dateSinistre ? new Date(s.dateSinistre).toLocaleDateString("fr-FR") : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Réclamé</p>
                      <p className="font-medium text-xs sm:text-sm mt-0.5 truncate">
                        {s.montantReclamation != null
                          ? Number(s.montantReclamation).toLocaleString("fr-FR") + " F"
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Remboursé</p>
                      <p className="font-bold text-green-600 text-sm sm:text-base mt-0.5 truncate">
                        {s.montantAccorde != null
                          ? Number(s.montantAccorde).toLocaleString("fr-FR") + " F"
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Moyen de paiement */}
                  {cfg.payment && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                      <FileText size={12} className="text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Mode : <span className="font-medium text-foreground">{cfg.payment}</span>
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
