/**
 * Composants partagés pour toutes les pages de l'espace client.
 *
 * Règles du design system :
 *  - Accent unique : blue-600
 *  - max-w-4xl sur toutes les pages client
 *  - Icônes uniquement depuis @/components/ui/Icons
 *  - Toast uniquement depuis sonner
 *  - Skeleton pour le loading pleine page
 *  - Spinner (Loader2) uniquement pour les actions inline
 */

import React from "react";
import { AlertCircle, RefreshCw } from "@/components/ui/Icons";
import { Card, CardContent } from "@/components/ui/card";

// ─── ClientPageHero ───────────────────────────────────────────────────────────
// Bandeau bleu en haut de chaque page client.
// Slot `action` pour le bouton Actualiser ou toute CTA secondaire.

interface ClientPageHeroProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function ClientPageHero({ icon, title, subtitle, action }: ClientPageHeroProps) {
  return (
    <div className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] rounded-2xl p-5 text-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-blue-100">Espace client</p>
            <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">{title}</h2>
            {subtitle && (
              <p className="text-sm text-blue-100 mt-0.5 leading-snug">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0 mt-0.5">{action}</div>}
      </div>
    </div>
  );
}

// ─── RefreshButton ────────────────────────────────────────────────────────────
// Bouton Actualiser standardisé, à passer dans le slot `action` du Hero.

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function RefreshButton({ onClick, loading }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors disabled:opacity-60"
    >
      <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
      <span className="hidden sm:inline">Actualiser</span>
    </button>
  );
}

// ─── KpiRow ───────────────────────────────────────────────────────────────────
// Ligne de KPI uniformisée. Supporte 2, 3 ou 4 items.

export type KpiColor = "blue" | "green" | "yellow" | "red" | "purple" | "orange";

export interface KpiItem {
  label: string;
  value: number | string;
  color?: KpiColor;
}

const KPI_PALETTE: Record<KpiColor, { num: string; bg: string; border: string }> = {
  blue:   { num: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-100"   },
  green:  { num: "text-green-700",  bg: "bg-green-50",  border: "border-green-100"  },
  yellow: { num: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-100" },
  red:    { num: "text-red-700",    bg: "bg-red-50",    border: "border-red-100"    },
  purple: { num: "text-purple-700", bg: "bg-purple-50", border: "border-purple-100" },
  orange: { num: "text-orange-700", bg: "bg-orange-50", border: "border-orange-100" },
};

export function KpiRow({ items }: { items: KpiItem[] }) {
  const cols =
    items.length === 2 ? "grid-cols-2" :
    items.length === 3 ? "grid-cols-3" :
    "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={`grid ${cols} gap-2 sm:gap-3`}>
      {items.map(k => {
        const c = KPI_PALETTE[k.color ?? "blue"];
        return (
          <div key={k.label} className={`${c.bg} border ${c.border} rounded-xl p-3 sm:p-4`}>
            <p className={`text-xl sm:text-2xl font-bold ${c.num} leading-none`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-tight">{k.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── FilterPills ──────────────────────────────────────────────────────────────
// Barre de filtres par statut, accent blue-600 quand actif.

export interface FilterPill {
  key: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  pills: FilterPill[];
  active: string;
  onChange: (key: string) => void;
}

export function FilterPills({ pills, active, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
      {pills.map(p => {
        const isActive = active === p.key;
        return (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-[#1B5299] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#1B5299] hover:text-[#1B5299]"
            }`}
          >
            {p.label}
            {p.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                isActive ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {p.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── SkeletonList ─────────────────────────────────────────────────────────────
// Skeleton animé pour le chargement initial. Supporte 1, 2 ou 3 colonnes.

export function SkeletonList({
  count = 3,
  cols = 1,
}: {
  count?: number;
  cols?: 1 | 2 | 3;
}) {
  const colClass =
    cols === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
    cols === 2 ? "grid-cols-1 sm:grid-cols-2" :
    "grid-cols-1";

  return (
    <div className={`grid ${colClass} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────
// Bannière d'erreur uniforme avec bouton Réessayer optionnel.

export function ErrorBanner({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-5 flex items-center gap-3 text-red-700">
        <AlertCircle size={20} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {message ?? "Impossible de charger les données"}
          </p>
          <p className="text-xs text-red-500 mt-0.5">
            Service temporairement indisponible
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 flex items-center gap-1 text-xs font-medium text-red-700 border border-red-300 rounded-lg px-2.5 py-1.5 hover:bg-red-100 transition-colors"
          >
            <RefreshCw size={11} />
            Réessayer
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
// État vide uniforme avec icône, titre, description et action optionnelle.

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="py-14 flex flex-col items-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground opacity-50">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-sm text-foreground">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
// Badge de statut centralisé. Couvre tous les statuts des pages client.

const STATUS_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROUVE:   "bg-blue-50  text-blue-700  border-blue-200",
  APPROUVEE:  "bg-blue-50  text-blue-700  border-blue-200",
  APPLIQUE:   "bg-green-50 text-green-700 border-green-200",
  REFUSE:     "bg-red-50   text-red-700   border-red-200",
  REFUSEE:    "bg-red-50   text-red-700   border-red-200",
  PAYE:       "bg-green-50 text-green-700 border-green-200",
  EN_RETARD:  "bg-red-50   text-red-700   border-red-200",
  ACTIF:      "bg-green-50 text-green-700 border-green-200",
  ACTIVE:     "bg-green-50 text-green-700 border-green-200",
  SUSPENDU:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  RESILIE:    "bg-red-50   text-red-700   border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  APPROUVE:   "Approuvé",
  APPROUVEE:  "Approuvée",
  APPLIQUE:   "Appliqué",
  REFUSE:     "Refusé",
  REFUSEE:    "Refusée",
  PAYE:       "Payé",
  EN_RETARD:  "En retard",
  ACTIF:      "Actif",
  ACTIVE:     "Actif",
  SUSPENDU:   "Suspendu",
  RESILIE:    "Résilié",
};

export function StatusBadge({ status }: { status: string }) {
  const upper = status?.toUpperCase() ?? "";
  const style = STATUS_STYLES[upper] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const label = STATUS_LABELS[upper] ?? status;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${style}`}>
      {label}
    </span>
  );
}

// ─── PageWrapper ──────────────────────────────────────────────────────────────
// Conteneur unique max-w-4xl pour toutes les pages client.

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto space-y-5 px-4 sm:px-6">
      {children}
    </div>
  );
}
