import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Breadcrumb from "@/components/admin/Breadcrumb";
import { motion } from "framer-motion";
import { apiClient } from "@/services/apiClient";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, Stethoscope, ClipboardList,
  AlertTriangle, ArrowLeft, RefreshCw,
  Phone, Mail, MapPin, Activity, BarChart2,
  CheckCircle, XCircle, Calendar,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Couleurs ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#F59E0B", "#10B981", "#EF4444", "#3B82F6", "#8B5CF6"];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Prestataire {
  id: number;
  nom: string;
  type: string;
  numero: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  statut: string;
}

interface StatsData {
  prestataire: Prestataire;
  totalConsultations: number;
  totalAssures: number;
  parStatut: Record<string, number>;
  monthlyData: Array<{ month: string; consultations: number }>;
  statutRepartition: Array<{ name: string; value: number }>;
}

// ─── Composant card KPI ──────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon, color, delay,
}: {
  title: string; value: string; sub?: string;
  icon: React.ReactNode; color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0 }}
      className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
          style={{ background: color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function PrestataireStatsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.request<StatsData>(`/prestataires/${id}/stats`);
      setData(res);
    } catch (err) {
      console.error("Erreur chargement stats:", err);
      setError("Impossible de charger les statistiques du prestataire");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── États de chargement et d'erreur ──────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Statistiques Prestataire">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6"><div className="h-64 bg-gray-200 rounded animate-pulse" /></Card>
            <Card className="p-6"><div className="h-64 bg-gray-200 rounded animate-pulse" /></Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout title="Statistiques Prestataire">
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {error || "Prestataire introuvable"}
              </h3>
              <p className="text-gray-600 text-sm max-w-md">
                Impossible de charger les statistiques de ce prestataire.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadStats}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={() => navigate("/admin/prestataires")}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Retour à la liste
              </button>
            </div>
          </div>
        </Card>
      </AppLayout>
    );
  }

  const { prestataire, totalConsultations, totalAssures, parStatut, monthlyData, statutRepartition } = data;

  return (
    <AppLayout title={`Statistiques - ${prestataire.nom}`}>
      <div className="space-y-6">
        <Breadcrumb items={[
          { label: "Accueil", path: "/dashboard" },
          { label: "Prestataires", path: "/admin/prestataires" },
          { label: prestataire.nom, path: `/admin/prestataires/${prestataire.id}` },
          { label: "Statistiques" },
        ]} />

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-6"
        >
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/admin/prestataires")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: "#1B5299" }}
                >
                  {prestataire.nom.split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{prestataire.nom}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{prestataire.numero}</Badge>
                    <Badge variant="secondary" className="text-xs">{prestataire.type}</Badge>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${prestataire.statut === "ACTIF" ? "bg-green-400" : "bg-gray-400"}`} />
                      <span className="text-xs text-muted-foreground">{prestataire.statut}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {prestataire.telephone && (
                  <div className="flex items-center gap-2"><Phone size={14} /><span>{prestataire.telephone}</span></div>
                )}
                {prestataire.email && (
                  <div className="flex items-center gap-2"><Mail size={14} /><span>{prestataire.email}</span></div>
                )}
                {prestataire.adresse && (
                  <div className="flex items-center gap-2"><MapPin size={14} /><span>{prestataire.adresse}</span></div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
          >
            <RefreshCw size={14} />
            Actualiser
          </button>
        </motion.div>

        {/* ── KPIs ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Assurés uniques"
            value={totalAssures.toLocaleString()}
            sub="Patients distincts"
            icon={<Users size={20} />}
            color="#3B82F6"
            delay={0.1}
          />
          <KpiCard
            title="Consultations"
            value={totalConsultations.toLocaleString()}
            sub="Total cumulé"
            icon={<Stethoscope size={20} />}
            color="#10B981"
            delay={0.2}
          />
          <KpiCard
            title="Complétées"
            value={(parStatut["COMPLETEE"] ?? 0).toLocaleString()}
            sub="Consultations terminées"
            icon={<CheckCircle size={20} />}
            color="#8B5CF6"
            delay={0.3}
          />
          <KpiCard
            title="Annulées"
            value={(parStatut["ANNULEE"] ?? 0).toLocaleString()}
            sub="Consultations annulées"
            icon={<XCircle size={20} />}
            color="#EF4444"
            delay={0.4}
          />
        </div>

        {/* ── Graphiques ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Évolution mensuelle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold">Consultations — 6 derniers mois</h3>
              </div>
              {monthlyData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} consultation(s)`, "Consultations"]} />
                    <Bar dataKey="consultations" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Consultations" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>

          {/* Répartition par statut */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList size={20} className="text-green-600" />
                <h3 className="text-lg font-semibold">Répartition par statut</h3>
              </div>
              {statutRepartition.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statutRepartition}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statutRepartition.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${v}`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </div>

        {/* ── Détail par statut ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity size={20} className="text-purple-600" />
              <h3 className="text-lg font-semibold">Détail par statut</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: "PROGRAMMEE", label: "Programmées", color: "yellow", bg: "bg-yellow-50", text: "text-yellow-600" },
                { key: "COMPLETEE",  label: "Complétées",  color: "green",  bg: "bg-green-50",  text: "text-green-600"  },
                { key: "ANNULEE",    label: "Annulées",    color: "red",    bg: "bg-red-50",    text: "text-red-600"    },
              ].map(({ key, label, bg, text }) => (
                <div key={key} className={`text-center p-4 rounded-lg ${bg}`}>
                  <div className={`text-3xl font-bold mb-1 ${text}`}>
                    {(parStatut[key] ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                  {totalConsultations > 0 && (
                    <div className={`text-xs mt-1 ${text}`}>
                      {Math.round((parStatut[key] ?? 0) / totalConsultations * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

      </div>
    </AppLayout>
  );
}
