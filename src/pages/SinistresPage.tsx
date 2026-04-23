import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle, XCircle, Clock, Banknote, AlertTriangle,
  Loader2, AlertCircle, FileWarning, Plus, Camera, MapPin, X,
} from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ─── Statuts ──────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { icon: React.ReactNode; style: string; label: string; short: string }> = {
  EN_ATTENTE: { icon: <Clock size={13} />,         style: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "En attente", short: "Attente"  },
  EN_COURS:   { icon: <AlertTriangle size={13} />,  style: "bg-blue-100 text-blue-700 border-blue-200",       label: "En cours",   short: "En cours" },
  APPROUVE:   { icon: <CheckCircle size={13} />,    style: "bg-purple-100 text-purple-700 border-purple-200", label: "Approuvé",   short: "Approuvé" },
  REJETE:     { icon: <XCircle size={13} />,        style: "bg-red-100 text-red-700 border-red-200",          label: "Rejeté",     short: "Rejeté"   },
  PAYE:       { icon: <Banknote size={13} />,       style: "bg-green-100 text-green-700 border-green-200",    label: "Payé",       short: "Payé"     },
};

const TYPE_LABELS: Record<string, string> = {
  all:          "Tous",
  CONSULTATION: "Consultation",
  HOSPITALISATION: "Hospitalisation",
  PHARMACIE:    "Pharmacie",
  BIOLOGIE:     "Biologie",
};

// ─── Formulaire déclaration sinistre (client) ─────────────────────────────────

function DeclareSinistreModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm]       = useState({ type: "CONSULTATION", montant: "", description: "", date: "" });
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto]     = useState<File | null>(null);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.montant || !form.date) {
      toast({ title: "Champs requis", description: "Veuillez renseigner la date et le montant.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await DataService.createSinistre({
        type:              form.type,
        montantReclamation: Number(form.montant),
        description:       form.description,
        dateSinistre:      form.date,
        statut:            "EN_ATTENTE",
      });
      toast({ title: "Sinistre déclaré", description: "Votre déclaration a été enregistrée. Suivi sous 48h." });
      onClose();
    } catch {
      toast({ title: "Erreur", description: "Impossible de soumettre la déclaration.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-xl border border-border shadow-xl"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-base">Déclarer un sinistre</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Type de sinistre */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Type de soin *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_LABELS).filter(([k]) => k !== "all").map(([k, label]) => (
                <button
                  key={k} type="button"
                  onClick={() => set("type", k)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.type === k
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Date du soin *
            </label>
            <input
              type="date"
              value={form.date}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => set("date", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Montant réclamé */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Montant réclamé (FCFA) *
            </label>
            <input
              type="number"
              min="0"
              value={form.montant}
              onChange={e => set("montant", e.target.value)}
              placeholder="Ex : 15000"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Motif de la consultation, actes réalisés…"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Photo facture */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Facture / Ordonnance (photo ou scan)
            </label>
            <label className="flex items-center gap-3 px-3 py-3 rounded-lg border border-dashed border-border hover:bg-muted/40 cursor-pointer transition-colors">
              <Camera size={18} className="text-muted-foreground shrink-0" />
              <div className="min-w-0">
                {photo ? (
                  <p className="text-sm font-medium truncate">{photo.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Appuyez pour prendre une photo ou choisir un fichier</p>
                )}
              </div>
              <input
                type="file"
                accept="image/*,.pdf"
                capture="environment"
                className="hidden"
                onChange={e => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {/* Géolocalisation info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
            <MapPin size={13} className="shrink-0" />
            <span>Votre position sera utilisée pour valider l'établissement de soins (optionnel).</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              Soumettre
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function SinistresPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isClient  = user?.role === "client";

  const [search,    setSearch]    = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sinistres, setSinistres] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    DataService.getSinistres()
      .then((list) => setSinistres(list ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [showModal]);

  const assureNom = (s: any) =>
    s.assure ? `${s.assure.nom} ${s.assure.prenom}` : "";

  const filtered = sinistres.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      (s.numero || "").toLowerCase().includes(q) ||
      assureNom(s).toLowerCase().includes(q);
    const matchType = typeFilter === "all" || s.type === typeFilter;
    return matchSearch && matchType;
  });

  const counts = Object.entries(statusConfig).map(([key, cfg]) => ({
    key, label: cfg.label, style: cfg.style, icon: cfg.icon,
    count: sinistres.filter((s) => s.statut === key).length,
  }));

  return (
    <AppLayout title={isClient ? "Mes Sinistres" : "Gestion des Sinistres"}>
      <div className="space-y-4 sm:space-y-5">

        {/* ── Compteurs statuts ──────────────────────────────────────── */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
            {counts.map(({ key, label, style, icon, count }) => (
              <div key={key} className="bg-card rounded-lg p-2.5 sm:p-3 border border-border flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border shrink-0 ${style}`}>{icon}</div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold leading-none">{count}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Barre d'actions ────────────────────────────────────────── */}
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

          {isClient && (
            <Button
              onClick={() => setShowModal(true)}
              className="gap-2 whitespace-nowrap shrink-0"
            >
              <Plus size={15} />
              Déclarer un sinistre
            </Button>
          )}
        </div>

        {/* ── Filtres type ────────────────────────────────────────────── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                typeFilter === key
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
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
            <p className="font-medium text-sm">Impossible de charger les sinistres</p>
            <p className="text-xs text-muted-foreground">Service temporairement indisponible</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <FileWarning size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold">{search || typeFilter !== "all" ? "Aucun résultat" : "Aucun sinistre enregistré"}</p>
            {!search && typeFilter === "all" && (
              <p className="text-sm text-muted-foreground max-w-sm">
                {isClient
                  ? "Utilisez le bouton \"Déclarer un sinistre\" pour soumettre une demande de remboursement."
                  : "Un sinistre est une déclaration de remboursement suite à des soins médicaux."}
              </p>
            )}
            {isClient && !search && typeFilter === "all" && (
              <Button size="sm" onClick={() => setShowModal(true)} className="gap-2 mt-1">
                <Plus size={14} />
                Déclarer un sinistre
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sinistre, i) => {
              const cfg = statusConfig[sinistre.statut] ?? statusConfig.EN_ATTENTE;
              const initiales = assureNom(sinistre).split(" ").map((n: string) => n[0]).join("").slice(0, 2);
              return (
                <motion.div
                  key={sinistre.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/sinistres/${sinistre.id}`)}
                  className="bg-card rounded-xl p-4 sm:p-5 border border-border hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 text-sm">
                        {initiales || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate text-sm sm:text-base">{assureNom(sinistre) || "Assuré inconnu"}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{sinistre.numero}</p>
                        {sinistre.type && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {TYPE_LABELS[sinistre.type] ?? sinistre.type}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium shrink-0 whitespace-nowrap ${cfg.style}`}>
                      {cfg.icon}
                      <span className="hidden sm:inline">{cfg.short}</span>
                    </span>
                  </div>

                  {/* Montants */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 border-t pt-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Date sinistre</p>
                      <p className="font-medium text-xs sm:text-sm">
                        {sinistre.dateSinistre
                          ? new Date(sinistre.dateSinistre).toLocaleDateString("fr-FR")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Réclamé</p>
                      <p className="font-medium text-xs sm:text-sm truncate">
                        {sinistre.montantReclamation != null
                          ? Number(sinistre.montantReclamation).toLocaleString("fr-FR") + " F"
                          : "—"}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-muted-foreground text-xs">Accordé</p>
                      <p className="font-semibold text-green-600 text-xs sm:text-sm truncate">
                        {sinistre.montantAccorde != null
                          ? Number(sinistre.montantAccorde).toLocaleString("fr-FR") + " F"
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {sinistre.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                      {sinistre.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modale déclaration sinistre ────────────────────────────── */}
      <AnimatePresence>
        {showModal && <DeclareSinistreModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </AppLayout>
  );
}
