import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/services/apiClient";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Banknote, FileText, AlertCircle,
  RefreshCw, Download,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFcfa(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M FCFA`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}k FCFA`;
  return `${val.toLocaleString("fr-FR")} FCFA`;
}

function fmtTooltip(val: number) {
  return `${val.toLocaleString("fr-FR")} FCFA`;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon, color, positive, delay,
}: {
  title: string; value: string; sub?: string;
  icon: React.ReactNode; color: string;
  positive?: boolean; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0 }}
      className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className={`p-2.5 rounded-lg ${color} shrink-0`}>{icon}</div>
        {positive !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {positive ? "Positif" : "Négatif"}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground font-medium">{title}</p>
      <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardFinancierPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.request<any>("/stats/financier");
      setData(res);
    } catch {
      toast.error("Impossible de charger les données financières");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (!data?.cashflow) return;
    const headers = ["Mois", "Encaissements (FCFA)", "Remboursements (FCFA)", "Solde (FCFA)"];
    const rows = data.cashflow.map((r: any) => [r.mois, r.encaissements, r.remboursements, r.solde]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financier-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const solde   = Number(data?.soldeNet ?? 0);
  const enc     = Number(data?.totalEncaissements ?? 0);
  const rem     = Number(data?.totalRemboursements ?? 0);
  const ratio   = Number(data?.ratioSP ?? 0);

  return (
    <AppLayout>
      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-full">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1B5299]/10">
              <Banknote className="text-[#1B5299]" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tableau de bord financier</h1>
              <p className="text-sm text-muted-foreground">Encaissements vs remboursements — 12 derniers mois</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-input bg-background hover:bg-muted transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-[#1B5299] text-white hover:bg-[#0F2D5A] transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
            <RefreshCw size={18} className="animate-spin" />
            Chargement…
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
            <AlertCircle size={32} className="opacity-30" />
            <p>Données indisponibles</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total encaissements"
                value={fmtFcfa(enc)}
                sub="Primes payées (cumul)"
                icon={<TrendingUp size={18} className="text-green-600" />}
                color="bg-green-100"
                delay={0}
              />
              <KpiCard
                title="Total remboursements"
                value={fmtFcfa(rem)}
                sub="Sinistres payés (cumul)"
                icon={<FileText size={18} className="text-red-600" />}
                color="bg-red-100"
                delay={0.05}
              />
              <KpiCard
                title="Solde net"
                value={fmtFcfa(Math.abs(solde))}
                sub={solde >= 0 ? "Excédent" : "Déficit"}
                icon={<Banknote size={18} className={solde >= 0 ? "text-blue-600" : "text-red-600"} />}
                color={solde >= 0 ? "bg-blue-100" : "bg-red-100"}
                positive={solde >= 0}
                delay={0.1}
              />
              <KpiCard
                title="Taux de sinistralité"
                value={`${ratio.toFixed(1)} %`}
                sub={ratio < 70 ? "Niveau sain (< 70 %)" : "Niveau critique (≥ 70 %)"}
                icon={<AlertCircle size={18} className={ratio < 70 ? "text-emerald-600" : "text-amber-600"} />}
                color={ratio < 70 ? "bg-emerald-100" : "bg-amber-100"}
                positive={ratio < 70}
                delay={0.15}
              />
            </div>

            {/* Alertes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle size={20} className="text-yellow-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">{data.primesPendantes} prime{data.primesPendantes !== 1 ? "s" : ""} en attente</p>
                  <p className="text-xs text-yellow-700">Paiements non encore encaissés</p>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle size={20} className="text-orange-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">{data.sinistresEnAttente} sinistre{data.sinistresEnAttente !== 1 ? "s" : ""} en attente</p>
                  <p className="text-xs text-orange-700">Remboursements à traiter</p>
                </div>
              </div>
            </div>

            {/* Graphique cashflow mensuel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-5 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-foreground mb-4">Flux de trésorerie mensuel — 12 mois</h2>
              <ResponsiveContainer width="100%" height={240} className="sm:!h-[280px]">
                <AreaChart data={data.cashflow} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="encGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="remGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                  <Tooltip formatter={(val: any) => [fmtTooltip(Number(val)), ""]} />
                  <Legend formatter={(v) => v === "encaissements" ? "Encaissements" : "Remboursements"} />
                  <Area type="monotone" dataKey="encaissements" name="encaissements" stroke="#10B981" fill="url(#encGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="remboursements" name="remboursements" stroke="#EF4444" fill="url(#remGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Graphique solde mensuel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card rounded-xl border border-border p-5 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-foreground mb-4">Solde net par mois</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.cashflow} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                  <Tooltip formatter={(val: any) => [fmtTooltip(Number(val)), "Solde net"]} />
                  <Bar
                    dataKey="solde"
                    name="Solde net"
                    fill="#1B5299"
                    radius={[4, 4, 0, 0]}
                    label={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
