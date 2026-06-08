import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { DataService } from "@/services/dataService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Stethoscope, Activity, CheckCircle, Clock, XCircle, TrendingUp, Users, Loader2,
} from "@/components/ui/Icons";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

export default function PrestataireDashboardPage() {
  const { myPrestataire } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prescriptions,  setPrescriptions]  = useState<any[]>([]);
  const [prestations,    setPrestations]    = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    Promise.all([
      DataService.getConsultations().catch(() => []),
      DataService.getPrescriptions().catch(() => []),
      DataService.getPrestations().catch(() => []),
    ]).then(([cons, presc, prest]) => {
      setConsultations(Array.isArray(cons) ? cons : []);
      setPrescriptions(Array.isArray(presc) ? presc : []);
      setPrestations(Array.isArray(prest) ? prest : []);
    }).finally(() => setLoading(false));
  }, []);

  // ─── Stats consultations ──────────────────────────────────────────────────

  const consStats = useMemo(() => {
    const total      = consultations.length;
    const completees = consultations.filter(c => c.statut === "COMPLETEE").length;
    const annulees   = consultations.filter(c => c.statut === "ANNULEE").length;
    const programmees= consultations.filter(c => c.statut === "PROGRAMMEE").length;
    const tauxCompletion = total > 0 ? Math.round(completees / total * 100) : 0;

    // Courbe 6 derniers mois
    const now = new Date();
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    consultations.forEach(c => {
      if (!c.dateConsultation && !c.createdAt) return;
      const d = new Date(c.dateConsultation ?? c.createdAt);
      const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      if (key in months) months[key]++;
    });
    const monthly = Object.entries(months).map(([mois, count]) => ({ mois, consultations: count }));

    const statutData = [
      { name: "Programmée",  value: programmees },
      { name: "Complétée",   value: completees  },
      { name: "Annulée",     value: annulees    },
    ].filter(d => d.value > 0);

    // Patients uniques
    const patientsUniques = new Set(consultations.map(c => c.assure?.id).filter(Boolean)).size;

    return { total, completees, annulees, programmees, tauxCompletion, monthly, statutData, patientsUniques };
  }, [consultations]);

  // ─── Stats prestations ────────────────────────────────────────────────────

  const prestStats = useMemo(() => {
    const total    = prestations.length;
    const fournies = prestations.filter(p => p.statut === "FOURNIE").length;
    const enAttente= prestations.filter(p => p.statut === "EN_ATTENTE").length;
    const refusees = prestations.filter(p => p.statut === "REFUSEE").length;
    const tauxFourniture = total > 0 ? Math.round(fournies / total * 100) : 0;

    const byType = prestations.reduce((acc: Record<string, number>, p) => {
      const type = p.type ?? "AUTRE";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});
    const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

    return { total, fournies, enAttente, refusees, tauxFourniture, typeData };
  }, [prestations]);

  const cards: StatCard[] = [
    {
      label: "Consultations totales",
      value: consStats.total,
      icon: <Stethoscope size={18} />,
      color: "bg-blue-50 text-blue-600 border-blue-200",
      sub: `${consStats.programmees} programmée${consStats.programmees > 1 ? "s" : ""}`,
    },
    {
      label: "Patients uniques",
      value: consStats.patientsUniques,
      icon: <Users size={18} />,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      label: "Taux de complétion",
      value: `${consStats.tauxCompletion} %`,
      icon: <TrendingUp size={18} />,
      color: "bg-violet-50 text-violet-600 border-violet-200",
      sub: `${consStats.completees} complétée${consStats.completees > 1 ? "s" : ""}`,
    },
    {
      label: "Prestations fournies",
      value: prestStats.fournies,
      icon: <CheckCircle size={18} />,
      color: "bg-amber-50 text-amber-600 border-amber-200",
      sub: `${prestStats.enAttente} en attente`,
    },
    {
      label: "Prescriptions émises",
      value: prescriptions.length,
      icon: <Activity size={18} />,
      color: "bg-rose-50 text-rose-600 border-rose-200",
    },
    {
      label: "Consultations annulées",
      value: consStats.annulees,
      icon: <XCircle size={18} />,
      color: "bg-slate-50 text-slate-500 border-slate-200",
    },
  ];

  return (
    <AppLayout title="Tableau de bord">
      <div className="space-y-6">

        {/* Header prestataire */}
        {myPrestataire && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Stethoscope size={22} />
            </div>
            <div>
              <p className="font-bold text-blue-900 text-lg">{myPrestataire.nom}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-white">
                  {myPrestataire.type?.replace(/_/g, " ")}
                </Badge>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  myPrestataire.statut === "ACTIF"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {myPrestataire.statut ?? "ACTIF"}
                </span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-60 gap-3 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            <span>Chargement des statistiques...</span>
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`p-4 border ${card.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {card.icon}
                      <span className="text-xs font-medium">{card.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    {card.sub && <p className="text-xs mt-0.5 opacity-70">{card.sub}</p>}
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Évolution consultations 6 mois */}
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-4 text-slate-700">Consultations — 6 derniers mois</h3>
                {consStats.monthly.every(m => m.consultations === 0) ? (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                    Aucune consultation enregistrée sur cette période
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={consStats.monthly} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                        formatter={(v: number) => [v, "Consultations"]}
                      />
                      <Bar dataKey="consultations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Répartition statuts consultations */}
              <Card className="p-5">
                <h3 className="font-semibold text-sm mb-4 text-slate-700">Répartition des consultations</h3>
                {consStats.statutData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                    Aucune donnée disponible
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={consStats.statutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {consStats.statutData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* Répartition types prestations */}
              {prestStats.total > 0 && (
                <Card className="p-5 lg:col-span-2">
                  <h3 className="font-semibold text-sm mb-4 text-slate-700">Prestations par type</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={prestStats.typeData}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 60, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}

            </div>

            {/* Barre de performance */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm mb-4 text-slate-700">Performance globale</h3>
              <div className="space-y-3">
                {[
                  { label: "Taux de complétion des consultations", value: consStats.tauxCompletion, color: "bg-blue-500" },
                  { label: "Taux de fourniture des prestations",   value: prestStats.tauxFourniture, color: "bg-emerald-500" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="font-semibold text-slate-800">{value} %</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
