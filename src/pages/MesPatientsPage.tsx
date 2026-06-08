import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users, Search, X, Calendar, Stethoscope, FileText,
  Loader2, AlertCircle, TrendingUp, Clock, CheckCircle, ChevronRight,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  id: string | number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  consultations: any[];
  derniere: string | null;
  statuts: Record<string, number>;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CFG = {
  COMPLETEE:  { label: "Effectuée",   dot: "bg-green-500",  text: "text-green-700",  badge: "bg-green-100 border-green-200 text-green-700"  },
  PROGRAMMEE: { label: "Programmée",  dot: "bg-blue-500",   text: "text-blue-700",   badge: "bg-blue-100 border-blue-200 text-blue-700"    },
  ANNULEE:    { label: "Annulée",     dot: "bg-red-400",    text: "text-red-600",    badge: "bg-red-100 border-red-200 text-red-600"       },
};

function StatusDot({ statut }: { statut: string }) {
  const cfg = STATUS_CFG[statut as keyof typeof STATUS_CFG];
  if (!cfg) return null;
  return <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />;
}

// ─── Patient Card ─────────────────────────────────────────────────────────────

function PatientCard({ patient, index, onClick }: { patient: Patient; index: number; onClick: () => void }) {
  const initiales = `${patient.nom[0] ?? ''}${patient.prenom[0] ?? ''}`.toUpperCase();
  const derniere   = patient.derniere
    ? new Date(patient.derniere).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : null;
  const completees  = patient.statuts.COMPLETEE  ?? 0;
  const programmees = patient.statuts.PROGRAMMEE ?? 0;
  const total       = patient.consultations.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      onClick={onClick}
      className="bg-card rounded-xl p-4 sm:p-5 border border-border hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0">
          {initiales || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                {patient.nom} {patient.prenom}
              </p>
              {patient.email && (
                <p className="text-xs text-muted-foreground truncate">{patient.email}</p>
              )}
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
            />
          </div>

          {/* Stats rapides */}
          <div className="flex flex-wrap items-center gap-3 mt-2.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Stethoscope size={12} className="shrink-0" />
              <span>{total} consultation{total !== 1 ? "s" : ""}</span>
            </div>
            {derniere && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar size={12} className="shrink-0" />
                <span>Dernière : {derniere}</span>
              </div>
            )}
          </div>

          {/* Mini statuts */}
          <div className="flex flex-wrap gap-2 mt-2">
            {completees > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-green-100 border-green-200 text-green-700 font-medium">
                <CheckCircle size={10} />
                {completees} effectuée{completees !== 1 ? "s" : ""}
              </span>
            )}
            {programmees > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-blue-100 border-blue-200 text-blue-700 font-medium">
                <Clock size={10} />
                {programmees} à venir
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Patient Detail Modal ─────────────────────────────────────────────────────

function PatientDetailPanel({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const navigate  = useNavigate();
  const initiales = `${patient.nom[0] ?? ''}${patient.prenom[0] ?? ''}`.toUpperCase();
  const total      = patient.consultations.length;
  const completees = patient.statuts.COMPLETEE  ?? 0;
  const taux       = total > 0 ? Math.round((completees / total) * 100) : 0;

  const sorted = [...patient.consultations].sort(
    (a, b) => new Date(b.dateConsultation ?? 0).getTime() - new Date(a.dateConsultation ?? 0).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 sm:rounded-t-2xl text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold">
              {initiales}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-blue-100">Fiche patient</p>
              <h2 className="text-xl font-bold">{patient.nom} {patient.prenom}</h2>
              {patient.email && <p className="text-sm text-blue-100 mt-0.5">{patient.email}</p>}
            </div>
          </div>

          {/* KPI inline */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "Consultations", value: total },
              { label: "Effectuées",    value: completees },
              { label: "Taux",          value: `${taux}%` },
            ].map(k => (
              <div key={k.label} className="bg-white/15 rounded-lg px-2 py-2 text-center">
                <p className="text-base font-bold">{k.value}</p>
                <p className="text-[10px] text-blue-100">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Taux bar */}
          <div className="mt-3">
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${taux}%` }}
              />
            </div>
          </div>
        </div>

        {/* Historique consultations */}
        <div className="p-4 sm:p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Historique des consultations
          </p>

          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Aucune consultation enregistrée</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((c: any, i) => {
                const cfg = STATUS_CFG[c.statut as keyof typeof STATUS_CFG] ?? STATUS_CFG.ANNULEE;
                const date = c.dateConsultation
                  ? new Date(c.dateConsultation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <div
                    key={c.id ?? i}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <StatusDot statut={c.statut} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {c.motif || "Consultation"}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                      {c.diagnostic && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          Diag. : {c.diagnostic}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar size={10} /> {date}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <button
              onClick={() => { navigate("/consultations/new"); onClose(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Stethoscope size={14} />
              Nouvelle consultation
            </button>
            <button
              onClick={() => { navigate("/prescriptions/new"); onClose(); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <FileText size={14} />
              Ordonnance
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Patient Detail Inline (desktop split-view) ───────────────────────────────

function PatientDetailInline({ patient, onNavigate }: { patient: Patient; onNavigate: () => void }) {
  const navigate  = useNavigate();
  const total      = patient.consultations.length;
  const completees = patient.statuts.COMPLETEE  ?? 0;
  const taux       = total > 0 ? Math.round((completees / total) * 100) : 0;

  const sorted = [...patient.consultations].sort(
    (a, b) => new Date(b.dateConsultation ?? 0).getTime() - new Date(a.dateConsultation ?? 0).getTime()
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-lg font-bold shrink-0">
            {`${patient.nom[0] ?? ''}${patient.prenom[0] ?? ''}`.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold truncate">{patient.nom} {patient.prenom}</h3>
            {patient.email && <p className="text-xs text-blue-100 truncate">{patient.email}</p>}
          </div>
          <button
            onClick={onNavigate}
            className="shrink-0 text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Dossier complet
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "Consultations", value: total },
            { label: "Effectuées",    value: completees },
            { label: "Taux",          value: `${taux}%` },
          ].map(k => (
            <div key={k.label} className="bg-white/15 rounded-lg px-2 py-1.5 text-center">
              <p className="text-sm font-bold">{k.value}</p>
              <p className="text-[10px] text-blue-100">{k.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Historique */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Historique</p>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Aucune consultation</p>
        ) : (
          <div className="space-y-2">
            {sorted.slice(0, 8).map((c: any, i) => {
              const cfg = STATUS_CFG[c.statut as keyof typeof STATUS_CFG] ?? STATUS_CFG.ANNULEE;
              const date = c.dateConsultation
                ? new Date(c.dateConsultation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                : "—";
              return (
                <div key={c.id ?? i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <StatusDot statut={c.statut} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{c.motif || "Consultation"}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium shrink-0 ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border flex gap-2">
        <button
          onClick={() => navigate(`/consultations/new?assureId=${patient.id}`)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Stethoscope size={14} />
          Nouvelle consultation
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MesPatientsPage() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);
  const [search, setSearch]               = useState("");
  const [selected, setSelected]           = useState<Patient | null>(null);

  useEffect(() => {
    DataService.getConsultations()
      .then(data => setConsultations(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const patients = useMemo<Patient[]>(() => {
    const map = new Map<string | number, Patient>();
    consultations.forEach(c => {
      if (!c.assure) return;
      const id = c.assure.id ?? `${c.assure.nom}-${c.assure.prenom}`;
      if (!map.has(id)) {
        map.set(id, {
          id,
          nom:    c.assure.nom    ?? "",
          prenom: c.assure.prenom ?? "",
          email:  c.assure.email,
          telephone: c.assure.telephone,
          consultations: [],
          derniere: null,
          statuts: {},
        });
      }
      const p = map.get(id)!;
      p.consultations.push(c);
      if (c.statut) p.statuts[c.statut] = (p.statuts[c.statut] ?? 0) + 1;
      if (c.dateConsultation && (!p.derniere || c.dateConsultation > p.derniere)) {
        p.derniere = c.dateConsultation;
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (!a.derniere) return 1;
      if (!b.derniere) return -1;
      return b.derniere.localeCompare(a.derniere);
    });
  }, [consultations]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(p =>
      `${p.nom} ${p.prenom}`.toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q)
    );
  }, [patients, search]);

  const totalConsultations = consultations.length;
  const totalEffectuees    = consultations.filter(c => c.statut === "COMPLETEE").length;

  return (
    <AppLayout title="Mes Patients">
      <div className="space-y-4 sm:space-y-5 px-4 sm:px-6">

        {/* KPI Bandeau */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Patients suivis",   value: patients.length,       icon: <Users size={15} />,        bg: "bg-blue-50",   border: "border-blue-200",  num: "text-blue-900",   sub: "text-blue-600",   iconBg: "bg-blue-600"   },
              { label: "Consultations",      value: totalConsultations,    icon: <Stethoscope size={15} />,  bg: "bg-blue-50",   border: "border-blue-200",  num: "text-blue-900",   sub: "text-blue-600",   iconBg: "bg-blue-600"   },
              { label: "Effectuées",         value: totalEffectuees,       icon: <CheckCircle size={15} />, bg: "bg-green-50",  border: "border-green-200", num: "text-green-900",  sub: "text-green-600",  iconBg: "bg-green-600"  },
            ].map(({ label, value, icon, bg, border, num, sub, iconBg }) => (
              <div key={label} className={`${bg} border ${border} rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${iconBg} rounded-lg flex items-center justify-center text-white shrink-0`}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-lg sm:text-2xl font-bold ${num} leading-none`}>{value}</p>
                  <p className={`text-xs sm:text-sm ${sub} truncate mt-0.5`}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-card">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient par nom ou email..."
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Compteur */}
        {!loading && !error && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={12} />
              {filtered.length} patient{filtered.length !== 1 ? "s" : ""}
              {search && ` correspondant à "${search}"`}
            </span>
          </div>
        )}

        {/* États communs */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-4 sm:p-5 border border-border animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-muted rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-4">
            <AlertCircle size={36} className="text-destructive opacity-60" />
            <p className="font-medium text-sm">Impossible de charger les patients</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <Users size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold text-sm">
              {search ? "Aucun patient correspondant" : "Aucun patient enregistré"}
            </p>
            {!search && (
              <p className="text-sm text-muted-foreground max-w-sm">
                Les patients apparaissent automatiquement lorsque vous enregistrez des consultations.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: split-view */}
            <div className="hidden md:grid md:grid-cols-[320px_1fr] gap-4">
              <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1">
                {filtered.map((patient, i) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    index={i}
                    onClick={() => setSelected(patient)}
                  />
                ))}
              </div>
              <div className="bg-card rounded-xl border border-border overflow-hidden min-h-[300px]">
                {selected ? (
                  <PatientDetailInline patient={selected} onNavigate={() => navigate(`/mes-patients/${selected.id}`)} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-3 text-center text-muted-foreground opacity-40">
                    <Users size={40} />
                    <p className="text-sm font-medium">Sélectionnez un patient</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: grille simple */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
              {filtered.map((patient, i) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  index={i}
                  onClick={() => setSelected(patient)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal mobile */}
      {selected && (
        <PatientDetailPanel
          patient={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </AppLayout>
  );
}
