import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Calendar, Stethoscope, FileText, Loader2, AlertCircle, Download, X } from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";

const statusConfig: Record<string, { style: string; label: string }> = {
  PROGRAMMEE: { style: "bg-blue-100 text-blue-700 border-blue-200",   label: "Programmée" },
  COMPLETEE:  { style: "bg-green-100 text-green-700 border-green-200", label: "Effectuée"  },
  ANNULEE:    { style: "bg-red-100 text-red-700 border-red-200",       label: "Annulée"    },
};

function exportCSV(consultations: any[]) {
  const headers = ["ID", "Assuré", "Prestataire", "Date", "Motif", "Diagnostic", "Statut"];
  const rows = consultations.map((c) => [
    c.id,
    c.assure ? `${c.assure.nom} ${c.assure.prenom}` : "",
    c.prestataire?.nom ?? "",
    c.dateConsultation
      ? new Date(c.dateConsultation).toLocaleDateString("fr-FR")
      : "",
    `"${(c.motif ?? "").replace(/"/g, '""')}"`,
    `"${(c.diagnostic ?? "").replace(/"/g, '""')}"`,
    c.statut ?? "",
  ]);
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `consultations_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ConsultationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    DataService.getConsultations()
      .then((list) => setConsultations(list ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const assureNom = (c: any) =>
    c.assure ? `${c.assure.nom} ${c.assure.prenom}` : "";

  const filtered = consultations.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      assureNom(c).toLowerCase().includes(q) ||
      (c.prestataire?.nom ?? "").toLowerCase().includes(q) ||
      (c.motif ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "TOUS" || c.statut === statusFilter;
    const cDate = c.dateConsultation ? new Date(c.dateConsultation) : null;
    const matchFrom = !dateFrom || (cDate && cDate >= new Date(dateFrom));
    const matchTo = !dateTo || (cDate && cDate <= new Date(dateTo + "T23:59:59"));
    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const counts = {
    PROGRAMMEE: consultations.filter((c) => c.statut === "PROGRAMMEE").length,
    COMPLETEE:  consultations.filter((c) => c.statut === "COMPLETEE").length,
    ANNULEE:    consultations.filter((c) => c.statut === "ANNULEE").length,
  };

  const hasFilters = search || statusFilter !== "TOUS" || dateFrom || dateTo;

  return (
    <AppLayout title="Suivi des Consultations">
      <div className="space-y-4 sm:space-y-5">

        {/* Compteurs */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {([
              { key: "PROGRAMMEE", bg: "bg-blue-50",  border: "border-blue-200",  iconBg: "bg-blue-600",  num: "text-blue-900",  sub: "text-blue-700",  icon: <Calendar size={15} /> },
              { key: "COMPLETEE",  bg: "bg-green-50", border: "border-green-200", iconBg: "bg-green-600", num: "text-green-900", sub: "text-green-700", icon: <FileText size={15} /> },
              { key: "ANNULEE",    bg: "bg-red-50",   border: "border-red-200",   iconBg: "bg-red-600",   num: "text-red-900",  sub: "text-red-700",  icon: <X size={15} /> },
            ] as const).map(({ key, bg, border, iconBg, num, sub, icon }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(statusFilter === key ? "TOUS" : key)}
                className={`${bg} border ${border} rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 text-left transition-all hover:shadow-sm ${statusFilter === key ? "ring-2 ring-offset-1 ring-current opacity-100" : "opacity-80 hover:opacity-100"}`}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${iconBg} rounded-lg flex items-center justify-center text-white shrink-0`}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-lg sm:text-2xl font-bold ${num} leading-none`}>{counts[key]}</p>
                  <p className={`text-xs sm:text-sm ${sub} truncate mt-0.5`}>{statusConfig[key].label}s</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Barre d'actions */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 sm:max-w-md px-3 py-2 rounded-lg border border-input bg-card">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par assuré, prestataire, motif..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!loading && !error && filtered.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)}>
                  <Download size={14} className="mr-1.5" />
                  <span className="hidden sm:inline">Exporter CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
              )}
              <Button className="whitespace-nowrap" onClick={() => navigate("/consultations/new")}>
                <Plus size={15} className="mr-1.5" />
                <span className="hidden sm:inline">Nouvelle consultation</span>
                <span className="sm:hidden">Nouvelle</span>
              </Button>
            </div>
          </div>

          {/* Filtres date */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={13} />
              <span>Du</span>
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs px-2 py-1.5 border border-input rounded-lg bg-background"
            />
            <span className="text-xs text-muted-foreground">au</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs px-2 py-1.5 border border-input rounded-lg bg-background"
            />
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setStatusFilter("TOUS"); setDateFrom(""); setDateTo(""); }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1"
              >
                <X size={12} /> Réinitialiser
              </button>
            )}
            {!loading && !error && (
              <span className="text-xs text-muted-foreground ml-auto">
                {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* États */}
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-4">
            <AlertCircle size={36} className="text-destructive opacity-60" />
            <p className="font-medium text-sm">Impossible de charger les consultations</p>
            <p className="text-xs text-muted-foreground">Service temporairement indisponible</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <Stethoscope size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold text-sm">
              {hasFilters ? "Aucun résultat pour ces filtres" : "Aucune consultation enregistrée"}
            </p>
            {!hasFilters && (
              <p className="text-sm text-muted-foreground max-w-sm">
                Les consultations sont les visites médicales des assurés chez les prestataires partenaires.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c, i) => {
              const cfg = statusConfig[c.statut] ?? statusConfig.COMPLETEE;
              const initiales = assureNom(c).split(" ").map((n: string) => n[0]).join("").slice(0, 2);
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="bg-card rounded-xl p-4 sm:p-5 border border-border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 text-sm">
                        {initiales || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate text-sm sm:text-base">{assureNom(c) || "Assuré inconnu"}</p>
                        {c.prestataire && (
                          <p className="text-xs text-muted-foreground truncate">{c.prestataire.nom}</p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border font-medium shrink-0 whitespace-nowrap ${cfg.style}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {c.dateConsultation && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={13} className="shrink-0" />
                        <span className="text-xs sm:text-sm">
                          {new Date(c.dateConsultation).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    {c.motif && (
                      <div className="flex items-start gap-2">
                        <Stethoscope size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Motif : <span className="text-foreground">{c.motif}</span>
                        </span>
                      </div>
                    )}
                    {c.diagnostic && (
                      <div className="flex items-start gap-2">
                        <FileText size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Diagnostic : <span className="text-foreground font-medium">{c.diagnostic}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
