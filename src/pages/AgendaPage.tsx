import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Calendar, Plus, Stethoscope,
  FileText, X, Clock, CheckCircle, AlertCircle, Loader2,
} from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_FR  = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = startOfMonth(year, month);
  const dow   = (first.getDay() + 6) % 7; // lundi = 0
  const days  = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(dow).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const STATUS_CFG = {
  COMPLETEE:  { label: "Effectuée",  dot: "bg-green-500",  badge: "bg-green-100 text-green-700 border-green-200" },
  PROGRAMMEE: { label: "Programmée", dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-700 border-blue-200"   },
  ANNULEE:    { label: "Annulée",    dot: "bg-red-400",    badge: "bg-red-100 text-red-600 border-red-200"       },
};

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

function DayPanel({
  date, consultations, onClose, onNew,
}: { date: Date; consultations: any[]; onClose: () => void; onNew: (date: Date) => void }) {
  const label = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const isToday = isoDate(date) === isoDate(new Date());

  return (
    <motion.div
      key={isoDate(date)}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col"
    >
      {/* Header */}
      <div className={`px-4 py-4 flex items-start justify-between gap-2 ${isToday ? "bg-blue-600 text-white" : "bg-muted/40 border-b border-border"}`}>
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? "text-blue-100" : "text-muted-foreground"}`}>
            {isToday ? "Aujourd'hui" : "Journée sélectionnée"}
          </p>
          <h3 className={`text-base font-bold capitalize mt-0.5 ${isToday ? "text-white" : "text-gray-900"}`}>{label}</h3>
          <p className={`text-xs mt-0.5 ${isToday ? "text-blue-100" : "text-muted-foreground"}`}>
            {consultations.length} consultation{consultations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-colors ${isToday ? "hover:bg-white/20 text-white" : "hover:bg-muted text-muted-foreground"}`}
        >
          <X size={15} />
        </button>
      </div>

      {/* Consultations */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {consultations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <Calendar size={28} className="text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Aucune consultation ce jour</p>
          </div>
        ) : (
          consultations.map((c, i) => {
            const cfg  = STATUS_CFG[c.statut as keyof typeof STATUS_CFG] ?? STATUS_CFG.COMPLETEE;
            const name = c.assure ? `${c.assure.nom ?? ""} ${c.assure.prenom ?? ""}`.trim() : "Assuré inconnu";
            const initiales = name.split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
            return (
              <motion.div
                key={c.id ?? i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initiales || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                  {c.motif && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{c.motif}</p>
                  )}
                  {c.diagnostic && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      Diag. : <span className="text-foreground">{c.diagnostic}</span>
                    </p>
                  )}
                  <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button className="w-full" size="sm" onClick={() => onNew(date)}>
          <Plus size={14} className="mr-1.5" />
          Nouvelle consultation
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

function MonthCalendar({
  year, month, byDay, selectedDate, onSelectDate,
}: {
  year: number;
  month: number;
  byDay: Map<string, any[]>;
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
}) {
  const cells   = getMonthGrid(year, month);
  const todayStr = isoDate(new Date());

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1.5 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const key      = isoDate(day);
          const consults = byDay.get(key) ?? [];
          const isToday  = key === todayStr;
          const isSelected = selectedDate && isoDate(selectedDate) === key;
          const hasCons  = consults.length > 0;

          const programmees = consults.filter(c => c.statut === "PROGRAMMEE").length;
          const completees  = consults.filter(c => c.statut === "COMPLETEE").length;
          const annulees    = consults.filter(c => c.statut === "ANNULEE").length;

          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={`
                relative flex flex-col items-center p-1 sm:p-1.5 rounded-lg transition-all min-h-[44px] sm:min-h-[56px]
                ${isSelected ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-400 ring-offset-1" :
                  isToday    ? "bg-blue-50 text-blue-700 border border-blue-300" :
                               "hover:bg-muted text-gray-700"}
              `}
            >
              <span className={`text-xs sm:text-sm font-semibold leading-none ${isSelected ? "text-white" : isToday ? "text-blue-700" : "text-gray-900"}`}>
                {day.getDate()}
              </span>

              {hasCons && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                  {programmees > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-blue-200" : "bg-blue-500"}`} />
                  )}
                  {completees > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-green-200" : "bg-green-500"}`} />
                  )}
                  {annulees > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-red-200" : "bg-red-400"}`} />
                  )}
                </div>
              )}

              {hasCons && (
                <span className={`hidden sm:block text-[9px] mt-0.5 font-medium leading-none ${isSelected ? "text-blue-100" : "text-muted-foreground"}`}>
                  {consults.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const navigate = useNavigate();
  const now      = new Date();

  const [year,         setYear]         = useState(now.getFullYear());
  const [month,        setMonth]        = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(now);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);

  useEffect(() => {
    DataService.getConsultations()
      .then(data => setConsultations(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Index par date ISO
  const byDay = useMemo(() => {
    const map = new Map<string, any[]>();
    consultations.forEach(c => {
      if (!c.dateConsultation) return;
      const key = c.dateConsultation.split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return map;
  }, [consultations]);

  const selectedConsultations = useMemo(() => {
    if (!selectedDate) return [];
    return byDay.get(isoDate(selectedDate)) ?? [];
  }, [selectedDate, byDay]);

  // Stats du mois affiché
  const monthStats = useMemo(() => {
    let programmees = 0, completees = 0, annulees = 0;
    byDay.forEach((consults, key) => {
      const d = new Date(key);
      if (d.getFullYear() === year && d.getMonth() === month) {
        consults.forEach(c => {
          if (c.statut === "PROGRAMMEE") programmees++;
          else if (c.statut === "COMPLETEE")  completees++;
          else if (c.statut === "ANNULEE")    annulees++;
        });
      }
    });
    return { programmees, completees, annulees };
  }, [byDay, year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else              setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else               setMonth(m => m + 1);
  };
  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(now);
  };

  const handleNewConsultation = (date: Date) => {
    navigate(`/consultations/new?date=${isoDate(date)}`);
  };

  return (
    <AppLayout title="Agenda">
      <div className="space-y-4 sm:space-y-5 px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Agenda des consultations</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Visualisez et planifiez vos consultations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Aujourd'hui
            </Button>
            <Button size="sm" onClick={() => navigate("/consultations/new")}>
              <Plus size={14} className="mr-1.5" />
              <span className="hidden sm:inline">Nouvelle consultation</span>
              <span className="sm:hidden">Nouvelle</span>
            </Button>
          </div>
        </div>

        {/* Stats du mois */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Programmées", count: monthStats.programmees, dot: "bg-blue-500",  bg: "bg-blue-50 border-blue-200",  num: "text-blue-900", icon: <Clock size={13} /> },
              { label: "Effectuées",  count: monthStats.completees,  dot: "bg-green-500", bg: "bg-green-50 border-green-200", num: "text-green-900", icon: <CheckCircle size={13} /> },
              { label: "Annulées",    count: monthStats.annulees,    dot: "bg-red-400",   bg: "bg-red-50 border-red-200",    num: "text-red-900",   icon: <X size={13} /> },
            ].map(({ label, count, bg, num, icon }) => (
              <div key={label} className={`border rounded-xl p-2.5 sm:p-3 flex items-center gap-2 ${bg}`}>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/70 rounded-lg flex items-center justify-center shrink-0 text-gray-600">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-base sm:text-xl font-bold ${num} leading-none`}>{count}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">

              {/* Navigation mois */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft size={18} />
                </button>
                <h3 className="text-base font-bold text-gray-900 capitalize">
                  {MONTHS_FR[month]} {year}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-sm">Chargement...</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 gap-2 text-center">
                  <AlertCircle size={32} className="text-destructive opacity-60" />
                  <p className="text-sm font-medium">Impossible de charger les consultations</p>
                </div>
              ) : (
                <MonthCalendar
                  year={year}
                  month={month}
                  byDay={byDay}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}

              {/* Légende */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
                {[
                  { color: "bg-blue-500",  label: "Programmée" },
                  { color: "bg-green-500", label: "Effectuée"  },
                  { color: "bg-red-400",   label: "Annulée"    },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day panel */}
          <div className="lg:col-span-1 min-h-[300px]">
            <AnimatePresence mode="wait">
              {selectedDate ? (
                <DayPanel
                  key={isoDate(selectedDate)}
                  date={selectedDate}
                  consultations={selectedConsultations}
                  onClose={() => setSelectedDate(null)}
                  onNew={handleNewConsultation}
                />
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center h-full min-h-[200px]"
                >
                  <Calendar size={36} className="text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">Sélectionnez un jour pour voir les consultations</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Liste consultations du mois */}
        {!loading && !error && (() => {
          const monthConsults = consultations
            .filter(c => {
              if (!c.dateConsultation) return false;
              const d = new Date(c.dateConsultation);
              return d.getFullYear() === year && d.getMonth() === month;
            })
            .sort((a, b) => new Date(b.dateConsultation).getTime() - new Date(a.dateConsultation).getTime());

          if (monthConsults.length === 0) return null;

          return (
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">
                  Consultations de {MONTHS_FR[month]} {year}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {monthConsults.length} au total
                </span>
              </div>
              <ul className="divide-y divide-border">
                {monthConsults.map((c, i) => {
                  const cfg  = STATUS_CFG[c.statut as keyof typeof STATUS_CFG] ?? STATUS_CFG.COMPLETEE;
                  const name = c.assure ? `${c.assure.nom ?? ""} ${c.assure.prenom ?? ""}`.trim() : "Assuré inconnu";
                  const date = c.dateConsultation
                    ? new Date(c.dateConsultation).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })
                    : "—";
                  const initiales = name.split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
                  return (
                    <motion.li
                      key={c.id ?? i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.25) }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => {
                        if (c.dateConsultation) {
                          const d = new Date(c.dateConsultation);
                          setYear(d.getFullYear());
                          setMonth(d.getMonth());
                          setSelectedDate(d);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initiales || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        {c.motif && (
                          <p className="text-xs text-muted-foreground truncate">{c.motif}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground capitalize">{date}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium mt-0.5 inline-block ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          );
        })()}

      </div>
    </AppLayout>
  );
}
