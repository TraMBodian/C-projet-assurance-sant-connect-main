import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Phone, Mail, MapPin, Building2, Stethoscope, Pill,
  ClipboardList, Heart, UserCog, X, MessageCircle, RefreshCw,
  CheckCircle, Clock, Star, Filter, Users, ArrowRight, ServerCrash,
} from "@/components/ui/Icons";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Prestataire {
  id:         string | number;
  numero:     string;
  nom:        string;
  type:       string;
  telephone?: string;
  email?:     string;
  adresse?:   string;
  statut:     string;
  createdAt?: string;
}

// ─── Config par type ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge: string;
  gradient: string;
  iconBg: string;
  description: string;
}> = {
  HOPITAL: {
    label:       "Hôpital",
    icon:        Building2,
    badge:       "bg-blue-100 text-blue-700 border-blue-200",
    gradient:    "from-[#0F2D5A] to-[#1B5299]",
    iconBg:      "bg-[#1B5299]",
    description: "Soins hospitaliers complets",
  },
  CLINIQUE: {
    label:       "Clinique",
    icon:        Stethoscope,
    badge:       "bg-blue-100 text-blue-700 border-blue-200",
    gradient:    "from-[#1B5299] to-[#2563BE]",
    iconBg:      "bg-[#2563BE]",
    description: "Consultations et soins spécialisés",
  },
  CABINET_MEDICAL: {
    label:       "Cabinet médical",
    icon:        UserCog,
    badge:       "bg-blue-100 text-blue-700 border-blue-200",
    gradient:    "from-[#1D4ED8] to-[#1B5299]",
    iconBg:      "bg-[#1D4ED8]",
    description: "Consultations médicales générales",
  },
  PHARMACIE: {
    label:       "Pharmacie",
    icon:        Pill,
    badge:       "bg-blue-100 text-blue-700 border-blue-200",
    gradient:    "from-[#2563BE] to-[#3B82F6]",
    iconBg:      "bg-[#3B82F6]",
    description: "Médicaments et conseil pharmaceutique",
  },
  LABORATOIRE: {
    label:       "Laboratoire",
    icon:        ClipboardList,
    badge:       "bg-blue-100 text-blue-700 border-blue-200",
    gradient:    "from-[#0F2D5A] to-[#2563BE]",
    iconBg:      "bg-[#0F2D5A]",
    description: "Analyses médicales et examens",
  },
  AUTRE: {
    label:       "Autre",
    icon:        Heart,
    badge:       "bg-blue-100 text-blue-700 border-blue-200",
    gradient:    "from-[#1B5299] to-[#60A5FA]",
    iconBg:      "bg-[#60A5FA]",
    description: "Autres services de santé",
  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG.AUTRE;
}

const CATEGORIES = [
  { key: "TOUS",          label: "Tous" },
  { key: "HOPITAL",       label: "Hôpitaux" },
  { key: "CLINIQUE",      label: "Cliniques" },
  { key: "CABINET_MEDICAL", label: "Cabinets médicaux" },
  { key: "PHARMACIE",     label: "Pharmacies" },
  { key: "LABORATOIRE",   label: "Laboratoires" },
  { key: "AUTRE",         label: "Autres" },
];

// ─── Card prestataire ─────────────────────────────────────────────────────────

function PrestataireCard({
  p,
  onSelect,
}: {
  p: Prestataire;
  onSelect: (p: Prestataire) => void;
}) {
  const cfg = getConfig(p.type);
  const Icon = cfg.icon;
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border border-border group cursor-pointer">
        {/* Bandeau supérieur coloré */}
        <div className={`h-1.5 bg-gradient-to-r ${cfg.gradient}`} />

        <div className="p-5">
          {/* En-tête : icône + nom + badge */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-11 h-11 rounded-xl ${cfg.iconBg} flex items-center justify-center shrink-0 text-white`}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{p.nom}</h3>
              <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${p.statut === "ACTIF" ? "bg-green-400" : "bg-gray-300"}`} title={p.statut === "ACTIF" ? "Disponible" : "Indisponible"} />
          </div>

          {/* Coordonnées */}
          <div className="space-y-1.5 mb-4">
            {p.adresse && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                <span className="truncate">{p.adresse}</span>
              </div>
            )}
            {p.telephone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone size={13} className="shrink-0" />
                <span>{p.telephone}</span>
              </div>
            )}
            {p.email && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={13} className="shrink-0" />
                <span className="truncate">{p.email}</span>
              </div>
            )}
            {!p.adresse && !p.telephone && !p.email && (
              <p className="text-xs text-muted-foreground italic">Coordonnées non renseignées</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8"
              onClick={() => onSelect(p)}
            >
              Voir le profil
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => navigate("/chat")}
            >
              <MessageCircle size={13} />
              Contacter
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Modal détail ─────────────────────────────────────────────────────────────

function PrestataireModal({
  p,
  onClose,
}: {
  p: Prestataire;
  onClose: () => void;
}) {
  const cfg = getConfig(p.type);
  const Icon = cfg.icon;
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header coloré */}
          <div className={`bg-gradient-to-r ${cfg.gradient} p-6 text-white relative`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Icon size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{p.nom}</h2>
                <p className="text-white/80 text-sm mt-0.5">{cfg.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
                    {cfg.label}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                    p.statut === "ACTIF" ? "bg-green-400/30 text-green-100" : "bg-gray-400/30 text-gray-100"
                  }`}>
                    {p.statut === "ACTIF"
                      ? <><CheckCircle size={11} /> Disponible</>
                      : <><Clock size={11} /> Indisponible</>
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Corps */}
          <div className="p-6 space-y-4">
            {/* Référence */}
            <div className="flex items-center justify-between text-sm py-2 border-b border-border">
              <span className="text-muted-foreground font-medium">Référence</span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{p.numero}</span>
            </div>

            {/* Coordonnées */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coordonnées</h4>
              <div className="space-y-2.5">
                {p.adresse ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MapPin size={15} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Adresse</p>
                      <p className="text-sm font-medium">{p.adresse}</p>
                    </div>
                  </div>
                ) : null}

                {p.telephone ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Phone size={15} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Téléphone</p>
                      <a href={`tel:${p.telephone}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {p.telephone}
                      </a>
                    </div>
                  </div>
                ) : null}

                {p.email ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Mail size={15} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <a href={`mailto:${p.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {p.email}
                      </a>
                    </div>
                  </div>
                ) : null}

                {!p.adresse && !p.telephone && !p.email && (
                  <p className="text-sm text-muted-foreground italic text-center py-2">
                    Coordonnées non renseignées
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={() => { navigate("/chat"); onClose(); }}
              >
                <MessageCircle size={16} />
                Envoyer un message
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { navigate("/prestations"); onClose(); }}
              >
                <ArrowRight size={16} />
                Voir les prestations
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ProfessionnelsSantePage() {
  const { user } = useAuth();
  const isAdmin   = user?.role === "admin";

  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);
  const [search,       setSearch]       = useState("");
  const [selectedType, setSelectedType] = useState("TOUS");
  const [selected,     setSelected]     = useState<Prestataire | null>(null);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await DataService.getPrestataires();
      setPrestataires(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filtrage
  const filtered = useMemo(() => {
    return prestataires.filter(p => {
      if (!isAdmin && p.statut !== "ACTIF") return false;
      if (selectedType !== "TOUS" && p.type !== selectedType) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.nom.toLowerCase().includes(q) ||
        (p.adresse ?? "").toLowerCase().includes(q) ||
        (p.telephone ?? "").includes(q) ||
        (p.email ?? "").toLowerCase().includes(q) ||
        getConfig(p.type).label.toLowerCase().includes(q)
      );
    });
  }, [prestataires, selectedType, search, isAdmin]);

  // Compteurs par type (parmi ACTIF)
  const counts = useMemo(() => {
    const active = prestataires.filter(p => isAdmin || p.statut === "ACTIF");
    return CATEGORIES.reduce((acc, cat) => {
      acc[cat.key] = cat.key === "TOUS"
        ? active.length
        : active.filter(p => p.type === cat.key).length;
      return acc;
    }, {} as Record<string, number>);
  }, [prestataires, isAdmin]);

  return (
    <AppLayout title="Professionnels de santé">
      <div className="space-y-0 px-4 sm:px-6">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] text-white rounded-xl mx-0 p-8 pb-20 relative overflow-hidden">
          {/* Décorations de fond */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope size={18} className="text-blue-300" />
              <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">Réseau de soins</span>
            </div>
            <h1 className="text-3xl font-bold mb-1">Professionnels de santé</h1>
            <p className="text-blue-100 text-base mb-8 max-w-xl">
              Trouvez rapidement un spécialiste adapté à vos besoins parmi nos prestataires agréés.
            </p>

            {/* Recherche déplacée sous les KPI pour éviter le chevauchement */}
          </div>
        </div>

        {/* ── Statistiques rapides ──────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-3 px-1 relative z-10 items-stretch">
          {CATEGORIES.slice(1).map(cat => {
            const cfg = getConfig(cat.key);
            const Icon = cfg.icon;
            const count = counts[cat.key] ?? 0;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedType(selectedType === cat.key ? "TOUS" : cat.key)}
                className={`bg-card rounded-xl border px-3 py-4 text-center shadow-sm hover:shadow-md transition-all ${
                  selectedType === cat.key ? "border-[#1B5299] ring-2 ring-[#1B5299]/20" : "border-border"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center mx-auto mb-2.5 text-white`}>
                  <Icon size={16} />
                </div>
                <p className="text-xl font-bold text-gray-900 leading-none">{count}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-1.5 line-clamp-2">{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* ── Recherche + Filtres catégories ────────────────────────────────── */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
          <div className="w-full sm:max-w-xl">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom, spécialité, adresse…"
                className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedType(cat.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border ${
                  selectedType === cat.key
                    ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"
                }`}
              >
                {cat.label}
                {cat.key !== "TOUS" && counts[cat.key] > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                    selectedType === cat.key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {counts[cat.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Info résultats + actualiser ───────────────────────────────────── */}
        <div className="flex items-center justify-between py-1">
          <p className="text-sm text-muted-foreground">
            {loading ? "Chargement…" : (
              <>
                <span className="font-semibold text-gray-900">{filtered.length}</span>
                {" "}prestataire{filtered.length !== 1 ? "s" : ""} trouvé{filtered.length !== 1 ? "s" : ""}
                {selectedType !== "TOUS" && <span> · {getConfig(selectedType).label}</span>}
              </>
            )}
          </p>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#1B5299] transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* ── Corps principal ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/3" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-2.5 bg-muted rounded w-full" />
                  <div className="h-2.5 bg-muted rounded w-2/3" />
                </div>
                <div className="flex gap-2 pt-3 border-t border-border">
                  <div className="h-8 bg-muted rounded flex-1" />
                  <div className="h-8 bg-muted rounded flex-1" />
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-12 text-center">
            <ServerCrash size={40} className="mx-auto text-muted-foreground opacity-40 mb-3" />
            <p className="font-semibold text-gray-900 mb-1">Service temporairement indisponible</p>
            <p className="text-sm text-muted-foreground mb-4">Veuillez réessayer dans quelques instants.</p>
            <Button onClick={load} variant="outline" size="sm">
              <RefreshCw size={14} />
              Réessayer
            </Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-muted-foreground" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">Aucun professionnel trouvé</p>
            <p className="text-sm text-muted-foreground mb-4">
              {search
                ? `Aucun résultat pour « ${search} »`
                : "Aucun professionnel disponible dans cette catégorie."
              }
            </p>
            <div className="flex gap-2 justify-center">
              {search && (
                <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                  <X size={14} />
                  Effacer la recherche
                </Button>
              )}
              {selectedType !== "TOUS" && (
                <Button variant="outline" size="sm" onClick={() => setSelectedType("TOUS")}>
                  Voir tous les prestataires
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map(p => (
              <PrestataireCard key={p.id} p={p} onSelect={setSelected} />
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Modal détail ──────────────────────────────────────────────────────── */}
      {selected && (
        <PrestataireModal p={selected} onClose={() => setSelected(null)} />
      )}
    </AppLayout>
  );
}
