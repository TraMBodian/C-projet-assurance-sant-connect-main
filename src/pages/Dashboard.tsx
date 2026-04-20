import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Shield, FileText, Banknote, Stethoscope, Pill,
  ClipboardList, Activity, Clock, Loader2, RefreshCw, ServerOff,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { MOCK_DASHBOARD } from '@/services/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalAssures: number;
  totalPolices: number;
  totalSinistres: number;
  totalPrestataires: number;
  totalConsultations: number;
  totalPrescriptions: number;
  sinistresEnAttente: number;
  sinistresApprouves: number;
  sinistresPaies: number;
  montantRembourse: number;
  recentActivity: Array<{
    id: number;
    action: string;
    detail: string;
    type: string;
    date: string | null;
    time?: string;
  }>;
  chartData: Array<{ mois: string; sinistres: number; remboursements: number }>;
}

const EMPTY: DashboardStats = {
  totalAssures: 0, totalPolices: 0, totalSinistres: 0,
  totalPrestataires: 0, totalConsultations: 0, totalPrescriptions: 0,
  sinistresEnAttente: 0, sinistresApprouves: 0, sinistresPaies: 0,
  montantRembourse: 0, recentActivity: [], chartData: [],
};

const PIE_COLORS = ['#F59E0B', '#8B5CF6', '#10B981'];

const ACTIVITY_STYLES: Record<string, string> = {
  en_attente:  'bg-orange-100 text-orange-600',
  en_cours:    'bg-blue-100 text-blue-600',
  approuve:    'bg-yellow-100 text-yellow-600',
  paye:        'bg-green-100 text-green-600',
  rejete:      'bg-red-100 text-red-600',
  default:     'bg-gray-100 text-gray-600',
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  en_attente: <Clock size={14} />,
  en_cours:   <Activity size={14} />,
  approuve:   <Shield size={14} />,
  paye:       <Banknote size={14} />,
  rejete:     <FileText size={14} />,
  default:    <Activity size={14} />,
};

function formatMontant(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}k`;
  return String(val);
}

// ─── Dashboard Header ─────────────────────────────────────────────────────────

function DashboardHeader({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const now = useMemo(() => new Date(), []);

  const dateLabel = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeLabel = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const roleLabel = user?.role === "admin" ? "Administrateur"
    : user?.role === "agent" ? "Agent"
    : user?.role === "client" ? "Client"
    : "Utilisateur";

  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/60">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {user?.full_name || roleLabel}
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
            {roleLabel}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
          <Activity size={11} className="text-green-500" />
          <span>Papy Services Assurances</span>
          <span className="text-border">·</span>
          <span className="capitalize">{dateLabel}</span>
          <span className="text-border">·</span>
          <Clock size={11} />
          <span>{timeLabel}</span>
        </p>
      </div>
      <button
        onClick={onRefresh}
        title="Actualiser les données"
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
      >
        <RefreshCw size={15} />
      </button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [stats, setStats]       = useState<DashboardStats>(EMPTY);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState(false);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setApiError(false);
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const ctrl   = new AbortController();
    const tid    = setTimeout(() => ctrl.abort(), 8000);

    fetch(`${apiUrl}/dashboard/stats`, { signal: ctrl.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => {
        const data = (json?.data ?? json) as DashboardStats;
        setStats({ ...EMPTY, ...data });
      })
      .catch(() => {
        // Backend indisponible → données de démonstration
        setStats({ ...EMPTY, ...MOCK_DASHBOARD });
      })
      .finally(() => {
        clearTimeout(tid);
        setLoading(false);
      });
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout title="Tableau de bord">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-muted-foreground text-sm">Chargement du tableau de bord…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (apiError) {
    return (
      <AppLayout title="Tableau de bord">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <ServerOff size={48} className="text-muted-foreground opacity-40" />
          <div>
            <p className="font-semibold text-lg">Service temporairement indisponible</p>
            <p className="text-sm text-muted-foreground mt-1">
              Impossible de contacter le serveur. Veuillez réessayer dans quelques instants.
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={15} />
            Réessayer
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const mainCards = [
    {
      title: 'Assurés',
      value: stats.totalAssures.toLocaleString('fr-FR'),
      icon: <Users size={20} />,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Polices actives',
      value: stats.totalPolices.toLocaleString('fr-FR'),
      icon: <Shield size={20} />,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Sinistres en attente',
      value: stats.sinistresEnAttente.toLocaleString('fr-FR'),
      icon: <FileText size={20} />,
      color: 'from-orange-400 to-orange-500',
      bg: 'bg-orange-50',
    },
    {
      title: 'Montant remboursé',
      value: `${formatMontant(stats.montantRembourse)} FCFA`,
      icon: <Banknote size={20} />,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  const secondaryCards = [
    { title: 'Prestataires',   value: stats.totalPrestataires,  icon: <Stethoscope size={18} />, color: 'text-teal-600',   bg: 'bg-teal-50'   },
    { title: 'Consultations',  value: stats.totalConsultations,  icon: <ClipboardList size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Prescriptions',  value: stats.totalPrescriptions,  icon: <Pill size={18} />,        color: 'text-pink-600',   bg: 'bg-pink-50'   },
    { title: 'Total sinistres', value: stats.totalSinistres,     icon: <Activity size={18} />,    color: 'text-red-500',    bg: 'bg-red-50'    },
  ];

  const pieData = [
    { name: 'En attente', value: stats.sinistresEnAttente, color: PIE_COLORS[0] },
    { name: 'Approuvés',  value: stats.sinistresApprouves, color: PIE_COLORS[1] },
    { name: 'Payés',      value: stats.sinistresPaies,     color: PIE_COLORS[2] },
  ].filter(d => d.value > 0);

  const chartData = stats.chartData?.length > 0 ? stats.chartData : [];

  return (
    <AppLayout title="Tableau de bord">
      <div className="space-y-5 lg:space-y-6">

        {/* ── Header professionnel ─────────────────────────────────────── */}
        <DashboardHeader user={user} onRefresh={fetchStats} />

        {/* ── Main KPI cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {mainCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`p-2 rounded-lg ${card.bg} flex-shrink-0`}>
                  <span className={`bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}>
                    {card.icon}
                  </span>
                </div>
              </div>
              <p className="text-xl xs:text-2xl sm:text-3xl font-bold mt-3 text-gray-900 leading-none truncate">{card.value}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{card.title}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Secondary counters ────────────────────────────────────────── */}
        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {secondaryCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 + i * 0.05 }}
                className="bg-card rounded-xl p-3 sm:p-4 border border-border flex items-center gap-2 sm:gap-3"
              >
                <div className={`p-1.5 sm:p-2 rounded-lg ${card.bg} flex-shrink-0`}>
                  <span className={card.color}>{card.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-xl font-bold text-gray-900 leading-none">{card.value}</p>
                  <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 truncate">{card.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Charts row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

          {/* Bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="lg:col-span-3 bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900">Sinistres & Remboursements</h3>
                <p className="text-xs text-muted-foreground mt-0.5">6 derniers mois</p>
              </div>
            </div>
            {chartData.length > 0 ? (
              <div className="h-48 sm:h-56 lg:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="sinistres"      name="Sinistres"       fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="remboursements" name="Remboursements"  fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée disponible
              </div>
            )}
          </motion.div>

          {/* Pie chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="lg:col-span-2 bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Répartition des sinistres</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total : {stats.totalSinistres}</p>
            </div>
            {pieData.length > 0 ? (
              <>
                <div className="h-40 sm:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="40%"
                        outerRadius="70%"
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }}
                        formatter={(val: number, name: string) => [`${val} (${stats.totalSinistres > 0 ? Math.round(val / stats.totalSinistres * 100) : 0}%)`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-3">
                  {pieData.map(entry => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-600">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                <Activity size={32} className="opacity-30" />
                <p className="text-sm">Aucun sinistre</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Recent activity ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
        >
          <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900">Activité récente</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {stats.recentActivity.length} événement{stats.recentActivity.length > 1 ? 's' : ''}
            </span>
          </div>

          {stats.recentActivity.length > 0 ? (
            <ul className="divide-y divide-border">
              {stats.recentActivity.map((item, idx) => {
                const key = item.type?.toLowerCase() || 'default';
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.04 }}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ACTIVITY_STYLES[key] || ACTIVITY_STYLES.default}`}>
                      {ACTIVITY_ICONS[key] || ACTIVITY_ICONS.default}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.action}</p>
                      {item.detail && (
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock size={11} />
                      <span>{item.time || (item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—')}</span>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Aucune activité récente
            </div>
          )}
        </motion.div>

      </div>
    </AppLayout>
  );
}
