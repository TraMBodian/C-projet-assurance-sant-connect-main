import { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, FileText, Banknote, Stethoscope, Pill,
  ClipboardList, Activity, Clock, Loader2, RefreshCw, ServerOff,
  TrendingUp, AlertTriangle, Plus, CheckCircle, XCircle, Eye,
  Bell, UserPlus, AlertCircle, Download, FileText as FileIcon,
  Calendar, CreditCard, AlertTriangle as WarningIcon, Circle, Check,
} from '@/components/ui/Icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AppLayout from '@/components/AppLayout';
import { useAuth, type AuthUser } from '@/context/AuthContext';

interface SessionEntry {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  loginTime: string;
  lastActivity: string;
  active: boolean;
}
import { apiClient } from '@/services/apiClient';
import { DataService } from '@/services/dataService';
import { usePusherChannel } from '@/hooks/usePusherChannel';
import { CH, EV, type StatsPayload, type ActivityPayload } from '@/services/pusherService';

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

const STATUS_STYLE: Record<string, { badge: string; dot: string; label: string }> = {
  en_attente:  { badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-400', label: 'En attente' },
  en_cours:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400',   label: 'En cours' },
  approuve:    { badge: 'bg-green-100 text-green-700 border-green-200',    dot: 'bg-green-400',  label: 'Approuvé' },
  paye:        { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Payé' },
  rejete:      { badge: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-400',    label: 'Rejeté' },
  default:     { badge: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400',   label: 'Inconnu' },
};

const ACTIVITY_ICONS: Record<string, ReactNode> = {
  en_attente: <Clock size={14} />,
  en_cours:   <Activity size={14} />,
  approuve:   <CheckCircle size={14} />,
  paye:       <Banknote size={14} />,
  rejete:     <XCircle size={14} />,
  default:    <Activity size={14} />,
};

type ClientType = 'individuel' | 'famille' | 'entreprise' | 'retraite' | 'medecin';

const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  individuel: 'Individuel',
  famille: 'Famille',
  entreprise: 'Entreprise',
  retraite: 'Retraité',
  medecin: 'Médecin',
};

const CLIENT_TYPE_SUMMARY: Record<ClientType, string> = {
  individuel: 'Une expérience simplifiée pour suivre vos remboursements et dossiers en un coup d’œil.',
  famille: 'Gardez toute votre famille protégée et suivez les visites, ordonnances et remboursements en collectif.',
  entreprise: 'Pilotez votre couverture d’entreprise avec des alertes priorisées pour vos employés.',
  retraite: 'Concentrez-vous sur vos soins essentiels avec des alertes claires sur vos garanties santé.',
  medecin: 'Accédez vite aux informations de vos patients et aux remboursements en cours.',
};

const CLIENT_TYPE_TIPS: Record<ClientType, string> = {
  individuel: 'Consultez rapidement vos remboursements et ordonnances.',
  famille: 'Aidez vos proches à préparer leurs documents et suivre leurs sinistres.',
  entreprise: 'Surveillez les demandes urgentes et priorisez les dossiers collectifs.',
  retraite: 'Vérifiez vos garanties et prenez rendez-vous chez votre médecin.',
  medecin: 'Organisez vos consultations et suivez les paiements de vos patients.',
};

function getClientTypeFromUser(user: AuthUser | null): ClientType {
  if (!user) return 'individuel';
  if (user.organization) return 'entreprise';
  return 'individuel';
}

function getMemberNumber(user: AuthUser | null): string {
  if (!user) return 'xxxxxx';
  return user.id.slice(-6).toUpperCase();
}

function formatMontant(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}k`;
  return String(val);
}

const PROFILE_KEY = (id: string) => `user_profile_${id}`;

function getDisplayName(user: AuthUser | null): string {
  if (!user) return 'Utilisateur';
  try {
    const saved = user.id ? localStorage.getItem(PROFILE_KEY(user.id)) : null;
    if (saved) {
      const p = JSON.parse(saved) as { prenom?: string; nom?: string };
      const name = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
      if (name) return name;
    }
  } catch {
    // Ignorer les erreurs de parse localStorage
  }
  return user.full_name || user.fullName || user.email || 'Utilisateur';
}

function formatRelative(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return 'À l\'instant';
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ─── Dashboard Header ───────────────────────────────────────────────────────

function DashboardHeader({ user, onRefresh, liveFlash }: { user: AuthUser | null; onRefresh: () => void; liveFlash: boolean }) {
  const displayName = getDisplayName(user);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue, {displayName}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {liveFlash && (
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="flex items-center gap-2 text-sm text-green-600"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            En direct
          </motion.div>
        )}
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} className="animate-spin" />
          Actualiser
        </button>
      </div>
    </motion.div>
  );
}

function ClientTypeSelector({ value, onChange }: { value: ClientType; onChange: (value: ClientType) => void }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Type de profil</p>
          <p className="text-xs text-muted-foreground">Personnalisez les recommandations</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(CLIENT_TYPE_LABELS).map(([key, label]) => {
          const type = key as ClientType;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors border whitespace-nowrap ${value === type ? 'bg-[#1B5299] text-white border-[#1B5299] shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]'}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UniversalSearchBar({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Recherche rapide</p>
          <p className="text-xs text-muted-foreground">Trouvez un dossier, une prescription ou un remboursement.</p>
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-[#1B5299] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0F2D5A] transition"
        >
          <Eye size={14} /> Rechercher
        </button>
      </div>
      <div className="flex items-center gap-2 border border-slate-200 rounded-2xl bg-slate-50 px-3 py-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder="Chercher : sinistre, remboursement, ordonnance..."
        />
        <Bell size={18} className="text-slate-500" />
      </div>
    </div>
  );
}

function SmartNotifications({ clientType, clientStats }: { clientType: ClientType; clientStats: ClientStats | null }) {
  const notices = [
    {
      title: 'Remboursement prioritaire',
      description: clientStats?.sinistresEnAttente > 0
        ? `${clientStats.sinistresEnAttente} dossier${clientStats.sinistresEnAttente > 1 ? 's' : ''} en attente. Nous accélérons le traitement.`
        : 'Aucun dossier en attente pour le moment. Continuez comme ça !',
      variant: clientStats?.sinistresEnAttente > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900',
    },
    {
      title: `Conseil ${CLIENT_TYPE_LABELS[clientType].toLowerCase()}`,
      description: CLIENT_TYPE_TIPS[clientType],
      variant: 'bg-slate-50 border-slate-200 text-slate-900',
    },
    {
      title: 'Prochaine étape',
      description: clientStats?.montantRembourse > 0
        ? 'Vous avez déjà reçu un remboursement. Votre dossier reste monitoré.'
        : 'Soumettez vos documents avant 23h pour un traitement en 48h.',
      variant: 'bg-blue-50 border-blue-200 text-blue-900',
    },
  ];

  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Alertes intelligentes</p>
          <p className="text-xs text-muted-foreground">Notifications adaptées à votre profil.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] uppercase tracking-[.18em] text-slate-600">Personnalisé</span>
      </div>
      <div className="space-y-3">
        {notices.map((notice) => (
          <div key={notice.title} className={`rounded-3xl border ${notice.variant} p-4`}> 
            <p className="text-sm font-semibold">{notice.title}</p>
            <p className="mt-1 text-xs leading-5">{notice.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DigitalHealthCard({ user, clientStats }: { user: AuthUser | null; clientStats: ClientStats | null }) {
  const navigate = useNavigate();
  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] p-5 text-white shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Carte santé</p>
          <h2 className="mt-2 text-xl font-semibold">Carte digitale</h2>
          <p className="mt-2 text-sm text-blue-100">Accédez à votre couverture et partagez-la facilement.</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-slate-100">
          <CreditCard size={24} />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-200">
        <div className="rounded-3xl bg-white/10 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-blue-200">N° adhérent</p>
          <p className="mt-2 font-semibold text-sm text-white">{getMemberNumber(user)}</p>
        </div>
        <div className="rounded-3xl bg-white/10 p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-blue-200">Validité</p>
          <p className="mt-2 font-semibold text-sm text-white">
            {clientStats?.policesActives > 0 ? 'Active' : '—'}
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-3xl bg-white/10 p-4 text-xs text-slate-200 border border-white/10">
        <p className="font-medium">Couvertures clés</p>
        <p className="mt-2 leading-5">{clientStats?.policesActives > 0 ? `${clientStats.policesActives} garanties actives` : 'Aucune police active détectée'}</p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/cartes')}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/20"
      >
        <Download size={16} /> Télécharger ma carte
      </button>
    </div>
  );
}

function ClaimProgressTracker({ clientStats }: { clientStats: ClientStats | null }) {
  const activeStep = clientStats?.sinistresEnAttente > 0 ? 1 : clientStats?.sinistresOuverts > 0 ? 2 : 0;
  const steps = [
    { label: 'Préparation', detail: 'Rassemblez vos documents.', status: activeStep === 0 ? 'current' : activeStep > 0 ? 'complete' : 'complete' },
    { label: 'Envoi', detail: 'Soumettez votre demande.', status: activeStep === 1 ? 'current' : activeStep > 1 ? 'complete' : 'pending' },
    { label: 'Vérification', detail: 'Nos experts analysent le dossier.', status: activeStep === 2 ? 'current' : activeStep > 2 ? 'complete' : 'pending' },
    { label: 'Paiement', detail: 'Remboursement programmé.', status: clientStats?.montantRembourse > 0 ? 'complete' : 'pending' },
  ];

  return (
    <div className="rounded-3xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Suivi de progression</p>
          <p className="text-xs text-muted-foreground">Visualisez où en est votre dossier.</p>
        </div>
        <span className="text-xs text-slate-500">{clientStats?.sinistresOuverts ?? 0} dossiers actifs</span>
      </div>
      <div className="space-y-3">
        {steps.map(step => (
          <div key={step.label} className="flex items-start gap-3">
            <div className={`shrink-0 mt-1 h-2.5 w-2.5 rounded-full ${step.status === 'complete' ? 'bg-emerald-500' : step.status === 'current' ? 'bg-blue-500' : 'bg-slate-300'}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Health Score ───────────────────────────────────────────────────────────

function HealthScore({ clientStats }: { clientStats: ClientStats | null }) {
  const calculateScore = () => {
    if (!clientStats) return { score: 0, factors: [] };

    const factors = [
      { name: 'Profil complété', completed: true, weight: 20 },
      { name: 'Carte active', completed: clientStats.policesActives > 0, weight: 25 },
      { name: 'Documents fournis', completed: clientStats.sinistresOuverts > 0, weight: 20 },
      { name: 'Ordonnances enregistrées', completed: clientStats.prescriptions > 0, weight: 20 },
      { name: 'Historique de remboursements', completed: clientStats.montantRembourse > 0, weight: 15 },
    ];

    const totalScore = factors.reduce((sum, factor) =>
      sum + (factor.completed ? factor.weight : 0), 0
    );

    return { score: totalScore, factors };
  };

  const { score, factors } = calculateScore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gradient-to-br from-blue-50 to-green-50 border border-emerald-200 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Score de santé</h3>
          <p className="text-sm text-emerald-700">Votre dossier est à {score}%</p>
        </div>
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-200 flex items-center justify-center">
            <span className="text-2xl font-bold text-emerald-600">{score}%</span>
          </div>
          <div
            className="absolute inset-0 rounded-full border-4 border-emerald-500 transition-all duration-1000"
            style={{
              background: `conic-gradient(from 0deg, #10b981 0deg, #10b981 ${(score / 100) * 360}deg, transparent ${(score / 100) * 360}deg)`,
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), black calc(100% - 4px))',
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {factors.map((factor, index) => (
          <motion.div
            key={factor.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="flex items-center justify-between text-sm"
          >
            <span className={`flex items-center gap-1.5 ${factor.completed ? 'text-gray-700' : 'text-gray-400'}`}>
              {factor.completed
                ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                : <Circle size={14} className="text-gray-300 shrink-0" />
              }
              {factor.name}
            </span>
            <span className={`font-medium ${factor.completed ? 'text-emerald-600' : 'text-gray-400'}`}>
              +{factor.weight}pts
            </span>
          </motion.div>
        ))}
      </div>

      {score < 80 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <p className="flex items-start gap-2 text-sm text-amber-800">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            Complétez votre profil pour atteindre 100% et bénéficier de remboursements plus rapides !
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Hero Section (Client) ────────────────────────────────────────────────────

function HeroSection({ user, clientType, navigate }: { user: AuthUser | null; clientType: ClientType; navigate: ReturnType<typeof useNavigate> }) {
  const displayName = getDisplayName(user);
  const firstName = displayName.split(' ')[0];
  const subtitle = clientType === 'entreprise'
    ? 'Votre couverture d’entreprise vous protège, vous et vos collaborateurs'
    : clientType === 'famille'
      ? 'Suivez la santé de toute la famille en un seul endroit'
      : clientType === 'retraite'
        ? 'Votre tranquillité santé commence ici'
        : clientType === 'medecin'
          ? 'Accédez vite aux dossiers et remboursements patients'
          : 'Votre couverture santé est active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
      </div>

      <div className="relative z-10">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Bonjour {firstName}</h1>
          <p className="text-blue-100 text-sm sm:text-base">Votre couverture santé est active</p>
        </div>

        <p className="text-blue-100 mb-6 text-sm sm:text-base">
          3 actions rapides pour avancer sur votre dossier
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/sinistres')}
            className="inline-flex min-h-[56px] items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-semibold transition-colors backdrop-blur-sm w-full text-left"
          >
            <AlertTriangle size={18} />
            <span>Faire une demande</span>
          </button>
          <button
            onClick={() => navigate('/remboursements')}
            className="inline-flex min-h-[56px] items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-semibold transition-colors backdrop-blur-sm w-full text-left"
          >
            <Banknote size={18} />
            <span>Voir mon remboursement</span>
          </button>
          <button
            onClick={() => navigate('/cartes')}
            className="inline-flex min-h-[56px] items-center justify-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 rounded-2xl text-sm font-semibold transition-colors backdrop-blur-sm w-full text-left"
          >
            <CreditCard size={18} />
            <span>Télécharger ma carte</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Action Priorities ────────────────────────────────────────────────────────

function ActionPriorities({ clientStats, navigate }: { clientStats: ClientStats | null; navigate: ReturnType<typeof useNavigate> }) {
  const priorities = [
    {
      icon: <Clock size={20} className="text-orange-500" />,
      title: "Demande en cours",
      description: `${clientStats?.sinistresEnAttente || 0} demande${(clientStats?.sinistresEnAttente || 0) > 1 ? 's' : ''} en analyse`,
      color: "border-orange-200 bg-orange-50",
      urgent: true,
      route: '/sinistres',
      cta: 'Voir le dossier',
    },
    {
      icon: <Banknote size={20} className="text-green-500" />,
      title: "Remboursement prêt",
      description: `${formatMontant(clientStats?.montantRembourse || 0)} FCFA disponible`,
      color: "border-green-200 bg-green-50",
      urgent: false,
      route: '/remboursements',
      cta: 'Consulter',
    },
    {
      icon: <Pill size={20} className="text-blue-500" />,
      title: "Ordonnances",
      description: `${clientStats?.prescriptions || 0} ordonnance${(clientStats?.prescriptions || 0) > 1 ? 's' : ''} à jour`,
      color: "border-blue-200 bg-blue-50",
      urgent: false,
      route: '/prescriptions',
      cta: 'Gérer',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions prioritaires</h2>
      {priorities.map((priority, idx) => (
        <motion.div
          key={priority.title}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + idx * 0.1 }}
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border ${priority.color} hover:shadow-sm transition-shadow cursor-pointer`}
        >
          <div className="flex-shrink-0">
            {priority.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900">{priority.title}</h3>
            <p className="text-sm text-gray-600">{priority.description}</p>
          </div>
          <button
            onClick={() => navigate(priority.route)}
            className="flex-shrink-0 rounded-full bg-[#1B5299]/10 text-[#1B5299] border border-[#1B5299]/30 px-3 py-2 text-sm font-semibold transition hover:bg-[#1B5299]/20"
          >
            {priority.cta}
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}

function ContextualAssistant({ clientType }: { clientType: ClientType }) {
  const docs = clientType === 'medecin'
    ? ['Convention de soins', 'Ordonnance récente', 'Dossier patient']
    : ['Facture', 'Ordonnance', 'Rapport médical'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] text-white rounded-3xl p-5 shadow-lg border border-[#1B5299]/40"
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h3 className="text-lg font-semibold">Besoin d’aide ?</h3>
          <p className="text-sm text-blue-100">Voici les documents que vous pouvez préparer.</p>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
          Assistant
        </span>
      </div>
      <div className="space-y-2">
        {docs.map(doc => (
          <div key={doc} className="flex items-center gap-2 text-sm text-white/90">
            <CheckCircle size={16} className="text-blue-200 shrink-0" />
            {doc}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-white/10 p-3 text-sm text-blue-100 border border-white/15">
        <p>Votre demande sera traitée sous 48h. Nous vous prévenons dès que l’état change.</p>
      </div>
    </motion.div>
  );
}

function ClientLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="h-28 rounded-3xl bg-slate-200/80 animate-pulse" />
        ))}
      </div>
      <div className="h-40 rounded-3xl bg-slate-200/80 animate-pulse" />
      <div className="h-28 rounded-3xl bg-slate-200/80 animate-pulse" />
    </div>
  );
}

// ─── Smart Timeline ───────────────────────────────────────────────────────────

function SmartTimeline({ activities }: { activities: DashboardStats['recentActivity'] }) {
  const timelineItems = activities.slice(0, 10).map(activity => {
    const date = activity.date ? new Date(activity.date) : new Date();
    const isToday = new Date().toDateString() === date.toDateString();
    const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();
    const timeLabel = isToday ? 'Aujourd\'hui' : isYesterday ? 'Hier' : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    let icon = <Activity size={16} className="text-gray-500" />;
    let statusColor = 'text-gray-500';

    switch (activity.type?.toLowerCase()) {
      case 'en_attente':
        icon = <Clock size={16} className="text-orange-500" />;
        statusColor = 'text-orange-600';
        break;
      case 'approuve':
      case 'paye':
        icon = <CheckCircle size={16} className="text-green-500" />;
        statusColor = 'text-green-600';
        break;
      case 'rejete':
        icon = <XCircle size={16} className="text-red-500" />;
        statusColor = 'text-red-600';
        break;
      default:
        icon = <Activity size={16} className="text-blue-500" />;
        statusColor = 'text-blue-600';
    }

    return {
      ...activity,
      icon,
      statusColor,
      timeLabel,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6"
    >
      <h3 className="font-semibold text-base text-gray-900 mb-4">Activité récente</h3>
      {timelineItems.length > 0 ? (
        <div className="space-y-4">
          {timelineItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + idx * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{item.action}</p>
                {item.detail && (
                  <p className="text-xs text-gray-600 mt-0.5">{item.detail}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{item.statusLabel}</span>
                  <span>•</span>
                  <span>{item.timeLabel}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
          Aucune mise à jour récente
        </div>
      )}
    </motion.div>
  );
}

// ─── Quick Actions (admin only) ───────────────────────────────────────────────

function MobileQuickActionsBar({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const items = [
    { label: 'Demande', icon: <AlertTriangle size={18} />, route: '/sinistres' },
    { label: 'Remboursement', icon: <Banknote size={18} />, route: '/remboursements' },
    { label: 'Carte', icon: <CreditCard size={18} />, route: '/cartes' },
    { label: 'Professionnels', icon: <Stethoscope size={18} />, route: '/professionnels-sante' },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-[0_-1px_30px_rgba(15,23,42,0.05)] sm:hidden">
      <div className="mx-auto flex max-w-3xl justify-between px-4 py-3">
        {items.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            className="inline-flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold text-[#1B5299] hover:bg-[#1B5299]/10 transition"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickActions({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const actions = [
    { label: 'Ajouter assuré',      icon: <UserPlus size={15} />,    color: 'bg-[#1B5299] hover:bg-[#0F2D5A]',     route: '/admin/assures/new' },
    { label: 'Créer contrat',       icon: <FileText size={15} />,    color: 'bg-purple-600 hover:bg-purple-700', route: '/admin/polices/new' },
    { label: 'Déclarer sinistre',   icon: <AlertCircle size={15} />, color: 'bg-orange-500 hover:bg-orange-600', route: '/sinistres' },
    { label: 'Nouveau prestataire', icon: <Plus size={15} />,        color: 'bg-[#1B5299] hover:bg-[#0F2D5A]',     route: '/admin/prestataires/new' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button
          key={a.label}
          onClick={() => navigate(a.route)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${a.color}`}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── Admin Alerts ─────────────────────────────────────────────────────────────

function AdminAlerts({ stats }: { stats: DashboardStats }) {
  const alerts = [];

  if (stats.sinistresEnAttente > 0) {
    alerts.push({
      key: 'sinistres',
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      icon: <Bell size={15} className="text-orange-500 shrink-0 mt-0.5" />,
      msg: `${stats.sinistresEnAttente} sinistre${stats.sinistresEnAttente > 1 ? 's' : ''} en attente de traitement.`,
    });
  }
  if (stats.totalPolices === 0 && stats.totalAssures > 0) {
    alerts.push({
      key: 'polices',
      color: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />,
      msg: 'Aucun contrat actif détecté. Vérifiez l\'état des polices.',
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(a => (
        <motion.div
          key={a.key}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${a.color}`}
        >
          {a.icon}
          {a.msg}
        </motion.div>
      ))}
    </div>
  );
}

// ─── KPI Card with trend ───────────────────────────────────────────────────────

interface KpiCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  trend?: { value: string; up: boolean };
}

function KpiCard({ card, delay }: { card: KpiCard; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`p-2 rounded-lg ${card.bg} flex-shrink-0`}>
          <span className={`bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}>
            {card.icon}
          </span>
        </div>
        {card.trend && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
            card.trend.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {card.trend.up ? '↑' : '↓'} {card.trend.value}
          </span>
        )}
      </div>
      <p className="text-xl xs:text-2xl sm:text-3xl font-bold mt-3 text-gray-900 leading-none truncate">{card.value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{card.title}</p>
    </motion.div>
  );
}

// ─── Operational Table : derniers sinistres ───────────────────────────────────

function OperationalTable({ activities, navigate }: { activities: DashboardStats['recentActivity']; navigate: ReturnType<typeof useNavigate> }) {
  const rows = activities.slice(0, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Activité récente</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Dernières demandes — actions rapides disponibles</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {activities.length} événement{activities.length > 1 ? 's' : ''}
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 sm:px-5 py-2.5 text-xs font-semibold text-muted-foreground">Action</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Détail</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Statut</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-right px-4 sm:px-5 py-2.5 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((item, idx) => {
                const key = item.type?.toLowerCase() || 'default';
                const s = STATUS_STYLE[key] || STATUS_STYLE.default;
                const canValidate = key === 'en_attente' || key === 'en_cours';
                const canReject   = key === 'en_attente';
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.03 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s.badge}`}>
                          {ACTIVITY_ICONS[key] || ACTIVITY_ICONS.default}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[140px]">{item.action}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground truncate max-w-[180px] block">{item.detail || '—'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {item.time || (item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—')}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => navigate('/sinistres')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                          <Eye size={11} /> Voir
                        </button>
                        {canValidate && (
                          <button
                            onClick={() => navigate('/sinistres')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
                          >
                            <CheckCircle size={11} /> Valider
                          </button>
                        )}
                        {canReject && (
                          <button
                            onClick={() => navigate('/sinistres')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                          >
                            <XCircle size={11} /> Rejeter
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Aucune activité récente
        </div>
      )}
    </motion.div>
  );
}

// ─── Connected Users (admin only) ────────────────────────────────────────────

function ConnectedUsers({ sessions }: { sessions: SessionEntry[] }) {
  const ROLE_LABEL: Record<string, string> = { admin: 'Admin', prestataire: 'Prestataire', client: 'Client' };
  const ROLE_COLOR: Record<string, string> = {
    admin:       'bg-brand/10 text-brand',
    prestataire: 'bg-purple-100 text-purple-700',
    client:      'bg-emerald-100 text-emerald-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="font-semibold text-sm sm:text-base text-gray-900">Utilisateurs connectés</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {sessions.length} en ligne
        </span>
      </div>
      {sessions.length > 0 ? (
        <ul className="divide-y divide-border">
          {sessions.map((s, idx) => {
            const initials = (s.fullName || s.email || '').split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??';
            return (
              <motion.li
                key={s.userId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + idx * 0.04 }}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.fullName || s.email}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLOR[s.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[s.role] || s.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                </div>
                <div className="shrink-0 text-right space-y-0.5">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock size={10} /> Connecté {formatRelative(s.loginTime)}
                  </p>
                  <p className="text-[10px] text-green-600 flex items-center gap-1 justify-end">
                    <Activity size={10} /> Actif {formatRelative(s.lastActivity)}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      ) : (
        <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
          Aucun utilisateur connecté
        </div>
      )}
    </motion.div>
  );
}

// ─── Prestataire Components ───────────────────────────────────────────────────

interface PrestataireDataType {
  prestataire: any | null;
  consultations: any[];
  prestations: any[];
  prescriptions: any[];
}

function PrestataireHeroSection({ data, navigate }: { data: PrestataireDataType | null; navigate: ReturnType<typeof useNavigate> }) {
  const nom  = data?.prestataire?.nom  ?? '';
  const type = data?.prestataire?.type ?? '';
  const TYPE_LABELS: Record<string, string> = {
    HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', PHARMACIE: 'Pharmacie',
    LABORATOIRE: 'Laboratoire', CABINET_MEDICAL: 'Cabinet médical', AUTRE: 'Autre',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />
      </div>
      <div className="relative z-10">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Espace Prestataire</h1>
          {nom && (
            <p className="text-blue-100 text-sm sm:text-base mt-0.5">
              {nom}{type && ` · ${TYPE_LABELS[type] ?? type}`}
            </p>
          )}
        </div>
        <p className="text-blue-100 mb-6 text-sm sm:text-base">
          Gérez vos consultations, prestations et prescriptions
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Consultation',  shortLabel: 'Cons.',    icon: <ClipboardList size={16} />, route: '/consultations/new' },
            { label: 'Mes Patients', shortLabel: 'Patients', icon: <Users size={16} />,        route: '/mes-patients' },
            { label: 'Prescription', shortLabel: 'Ord.',     icon: <FileText size={16} />,     route: '/prescriptions/new' },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={() => navigate(btn.route)}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 px-3 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors backdrop-blur-sm"
            >
              {btn.icon}
              <span className="hidden sm:inline">{btn.label}</span>
              <span className="sm:hidden">{btn.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function PrestataireKpiBandeau({ data, loading }: { data: PrestataireDataType | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
      </div>
    );
  }
  const completees     = data.consultations.filter((c: any) => c.statut === 'COMPLETEE').length;
  const programmees    = data.consultations.filter((c: any) => c.statut === 'PROGRAMMEE').length;
  const enAttentePrest = data.prestations.filter((p: any)  => p.statut === 'EN_ATTENTE').length;
  const prescTotal     = data.prescriptions.length;

  const cards: KpiCard[] = [
    { title: 'Consultations effectuées',  value: completees,     icon: <CheckCircle size={20} />, color: 'from-[#1B5299] to-[#2563BE]', bg: 'bg-emerald-50' },
    { title: 'Consultations programmées', value: programmees,    icon: <Calendar size={20} />,    color: 'from-[#1B5299] to-[#2563BE]',      bg: 'bg-blue-50'    },
    { title: 'Prestations en attente',    value: enAttentePrest, icon: <Clock size={20} />,       color: 'from-orange-400 to-orange-500',  bg: 'bg-orange-50', trend: enAttentePrest > 0 ? { value: 'À traiter', up: false } : undefined },
    { title: 'Prescriptions créées',      value: prescTotal,     icon: <Pill size={20} />,        color: 'from-purple-500 to-purple-600',  bg: 'bg-purple-50'  },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vue d'ensemble</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, i) => <KpiCard key={card.title} card={card} delay={i * 0.07} />)}
      </div>
    </div>
  );
}

function PrestataireActivity({ data, navigate }: { data: PrestataireDataType; navigate: ReturnType<typeof useNavigate> }) {
  const recentConsultations = [...data.consultations]
    .sort((a, b) => new Date(b.dateConsultation ?? b.createdAt ?? 0).getTime() - new Date(a.dateConsultation ?? a.createdAt ?? 0).getTime())
    .slice(0, 5);
  const pendingPrestations = data.prestations.filter((p: any) => p.statut === 'EN_ATTENTE').slice(0, 5);
  const TYPE_MAP: Record<string, string> = {
    MEDICAMENT: 'Médicament', CONSULTATION: 'Consultation', ANALYSE: 'Analyse',
    HOSPITALISATION: 'Hospitalisation', CHIRURGIE: 'Chirurgie', AUTRE: 'Autre',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Consultations récentes */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-gray-900">Consultations récentes</h3>
            <p className="text-xs text-muted-foreground">Dernières interventions</p>
          </div>
          <button onClick={() => navigate('/consultations')} className="text-xs text-blue-600 hover:underline font-medium">
            Tout voir
          </button>
        </div>
        {recentConsultations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <ClipboardList size={28} className="opacity-30" />
            <p className="text-sm">Aucune consultation enregistrée</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentConsultations.map((c: any, i) => {
              const name = c.assure ? `${c.assure.nom ?? ''} ${c.assure.prenom ?? ''}`.trim() : 'Assuré inconnu';
              const initials = name.split(' ').map((n: string) => n[0] ?? '').join('').slice(0, 2) || '?';
              const date = c.dateConsultation
                ? new Date(c.dateConsultation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                : '—';
              const badge = c.statut === 'COMPLETEE'
                ? 'bg-green-100 text-green-700 border-green-200'
                : c.statut === 'PROGRAMMEE'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-red-100 text-red-700 border-red-200';
              const badgeLabel = c.statut === 'COMPLETEE' ? 'Effectuée' : c.statut === 'PROGRAMMEE' ? 'Programmée' : 'Annulée';
              return (
                <motion.li
                  key={c.id ?? i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#1B5299] to-[#2563BE] rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.motif ?? '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{date}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium mt-0.5 inline-block ${badge}`}>
                      {badgeLabel}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.div>

      {/* Prestations en attente */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-gray-900">Prestations en attente</h3>
            <p className="text-xs text-muted-foreground">Actions requises de votre part</p>
          </div>
          <button onClick={() => navigate('/prestations')} className="text-xs text-blue-600 hover:underline font-medium">
            Tout voir
          </button>
        </div>
        {pendingPrestations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <CheckCircle size={28} className="text-emerald-400" />
            <p className="text-sm">Aucune prestation en attente</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {pendingPrestations.map((p: any, i) => {
              const name = p.assure ? `${p.assure.nom ?? ''} ${p.assure.prenom ?? ''}`.trim() : 'Assuré inconnu';
              return (
                <motion.li
                  key={p.id ?? i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shrink-0">
                    <Clock size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{TYPE_MAP[p.type] ?? p.type ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => navigate('/prestations')}
                    className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors shrink-0"
                  >
                    Traiter
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

// ─── Prestataire Analytics ────────────────────────────────────────────────────

function buildPrestataireCharts(data: PrestataireDataType) {
  const now = new Date();
  const consultChart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { mois: MONTHS_FR[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), effectuees: 0, programmees: 0 };
  });
  data.consultations.forEach(c => {
    if (!c.dateConsultation) return;
    const d   = new Date(c.dateConsultation);
    const slot = consultChart.find(sl => sl.year === d.getFullYear() && sl.month === d.getMonth());
    if (!slot) return;
    if (c.statut === 'COMPLETEE')  slot.effectuees++;
    else if (c.statut === 'PROGRAMMEE') slot.programmees++;
  });
  const TYPE_MAP_L: Record<string, string> = {
    MEDICAMENT: 'Médicament', CONSULTATION: 'Consultation', ANALYSE: 'Analyse',
    HOSPITALISATION: 'Hospitalisation', CHIRURGIE: 'Chirurgie', AUTRE: 'Autre',
  };
  const COLORS_PREST = ['#0D9488','#0891B2','#7C3AED','#D97706','#DC2626','#64748B'];
  const typeCounts: Record<string, number> = {};
  data.prestations.forEach(p => {
    const t = p.type ?? 'AUTRE';
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  });
  const prestTypeData = Object.entries(typeCounts).map(([type, value], i) => ({
    name: TYPE_MAP_L[type] ?? type, value, color: COLORS_PREST[i % COLORS_PREST.length],
  }));
  return {
    consultChart: consultChart.map(({ mois, effectuees, programmees }) => ({ mois, effectuees, programmees })),
    prestTypeData,
  };
}

function PrestataireAnalytics({ data }: { data: PrestataireDataType }) {
  const { consultChart, prestTypeData } = buildPrestataireCharts(data);
  const hasConsultData = consultChart.some(d => d.effectuees > 0 || d.programmees > 0);
  const total          = data.consultations.length;
  const completees     = data.consultations.filter((c: any) => c.statut === 'COMPLETEE').length;
  const annulees       = data.consultations.filter((c: any) => c.statut === 'ANNULEE').length;
  const presenceBase   = completees + annulees;
  const taux           = presenceBase > 0 ? Math.round((completees / presenceBase) * 100) : 0;
  const avgMois        = (total / Math.max(1, consultChart.filter(d => d.effectuees + d.programmees > 0).length || 1)).toFixed(1);

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Analytics</p>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bar chart consultations */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Consultations par mois</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Effectuées vs programmées — 6 derniers mois</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-blue-600">{hasConsultData ? avgMois : '0'}</p>
              <p className="text-[10px] text-muted-foreground">moy./mois</p>
            </div>
          </div>
          {hasConsultData ? (
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultChart} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="effectuees"  name="Effectuées"  fill="#0D9488" radius={[4,4,0,0]} maxBarSize={40} />
                  <Bar dataKey="programmees" name="Programmées" fill="#0EA5E9" radius={[4,4,0,0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 sm:h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <TrendingUp size={32} className="opacity-20" />
              <p className="text-sm">Aucune donnée disponible</p>
              <p className="text-xs">Commencez à enregistrer des consultations</p>
            </div>
          )}
        </motion.div>

        {/* Pie + taux */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm flex-1"
          >
            <div className="mb-3">
              <h3 className="font-semibold text-sm text-gray-900">Prestations par type</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Total : {data.prestations.length}</p>
            </div>
            {prestTypeData.length > 0 ? (
              <>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={prestTypeData} cx="50%" cy="50%" innerRadius="38%" outerRadius="68%" paddingAngle={3} dataKey="value">
                        {prestTypeData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }}
                        formatter={(val: number, name: string) => [val, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {prestTypeData.slice(0, 4).map(entry => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-gray-600 truncate">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 gap-2 text-muted-foreground">
                <Pill size={28} className="opacity-30" />
                <p className="text-xs">Aucune prestation enregistrée</p>
              </div>
            )}
          </motion.div>

          {/* Taux d'effectuation */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            className="bg-gradient-to-br from-blue-50 to-blue-50 border border-blue-200 rounded-xl p-4"
          >
            <p className="text-xs font-semibold text-blue-700 mb-2">Indicateur clé</p>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-medium text-gray-800">Taux de présence</p>
              <span className={`text-lg font-bold ${taux >= 80 ? 'text-blue-600' : taux >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                {presenceBase > 0 ? `${taux}%` : '—'}
              </span>
            </div>
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: presenceBase > 0 ? `${taux}%` : '0%' }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className={`h-full rounded-full ${taux >= 80 ? 'bg-gradient-to-r from-[#1B5299] to-[#2563BE]' : taux >= 50 ? 'bg-orange-400' : 'bg-red-400'}`}
              />
            </div>
            <p className="text-[10px] text-blue-700 mt-1.5">
              {presenceBase > 0
                ? `${completees} présent${completees !== 1 ? 's' : ''} · ${annulees} annulé${annulees !== 1 ? 'es' : 'e'} (hors programmées)`
                : 'Aucune consultation terminée ou annulée'}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Client Stats ─────────────────────────────────────────────────────────────

interface ClientPolicy {
  statut?: string;
}

interface ClientSinistre {
  dateSinistre?: string;
  statut?: string;
  montantReclamation?: number | string;
  montantAccorde?: number | string;
}

type ClientPrescription = Record<string, unknown>;

interface ClientStats {
  policesActives: number;
  sinistresOuverts: number;
  sinistresEnAttente: number;
  montantRembourse: number;
  totalReclame: number;
  prescriptions: number;
  chartData: Array<{ mois: string; reclame: number; rembourse: number }>;
}

const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function buildClientStats(polices: ClientPolicy[], sinistres: ClientSinistre[], prescriptions: ClientPrescription[]): ClientStats {
  const now   = new Date();
  const chart = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { mois: MONTHS_FR[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), reclame: 0, rembourse: 0 };
  });
  sinistres.forEach(s => {
    if (!s.dateSinistre) return;
    const d    = new Date(s.dateSinistre);
    const slot = chart.find(sl => sl.year === d.getFullYear() && sl.month === d.getMonth());
    if (slot) {
      slot.reclame   += Number(s.montantReclamation ?? 0);
      slot.rembourse += Number(s.montantAccorde ?? 0);
    }
  });
  return {
    policesActives:     polices.filter(p => (p.statut || 'ACTIVE') === 'ACTIVE').length,
    sinistresOuverts:   sinistres.filter(s => s.statut === 'EN_COURS' || s.statut === 'EN_ATTENTE').length,
    sinistresEnAttente: sinistres.filter(s => s.statut === 'EN_ATTENTE').length,
    montantRembourse:   sinistres.filter(s => s.statut === 'PAYE').reduce((a, s) => a + Number(s.montantAccorde ?? 0), 0),
    totalReclame:       sinistres.reduce((a, s) => a + Number(s.montantReclamation ?? 0), 0),
    prescriptions:      prescriptions.length,
    chartData:          chart.map(({ mois, reclame, rembourse }) => ({ mois, reclame, rembourse })),
  };
}

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, myPrestataire: contextPrestataire } = useAuth();
  const navigate  = useNavigate();
  const isAdmin       = user?.role === 'admin';
  const isClient      = user?.role === 'client';
  const isPrestataire = user?.role === 'prestataire';

  const [stats, setStats]             = useState<DashboardStats>(EMPTY);
  const [loading, setLoading]         = useState(true);
  const [apiError, setApiError]       = useState(false);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientType, setClientType]   = useState<ClientType>(() => getClientTypeFromUser(user));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSummary, setSearchSummary] = useState<string | null>(null);
  const [sessions, setSessions]       = useState<SessionEntry[]>([]);
  const [liveFlash, setLiveFlash]     = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [prestataireData,    setPrestataireData]    = useState<PrestataireDataType | null>(null);
  const [prestataireLoading, setPrestataireLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setClientType(getClientTypeFromUser(user));
  }, [user]);

  const fetchSessions = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await apiClient.request<SessionEntry[]>('/admin/active-users');
      setSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur récupération sessions actives', error);
      setSessions([]);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30_000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const fetchStats = useCallback(() => {
    if (!isAdmin) { setLoading(false); return; }
    setLoading(true);
    setApiError(false);
    apiClient.request<DashboardStats>('/dashboard/stats')
      .then(data => setStats({ ...EMPTY, ...data }))
      .catch(() => setApiError(true))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const fetchClientStats = useCallback(() => {
    if (!isClient) return;
    setClientLoading(true);
    Promise.all([
      DataService.getPolices(user).catch(() => [] as ClientPolicy[]),
      DataService.getSinistres(user).catch(() => [] as ClientSinistre[]),
      DataService.getPrescriptions(user).catch(() => [] as ClientPrescription[]),
    ]).then(([polices, sinistres, prescriptions]) => {
      setClientStats(buildClientStats(polices ?? [], sinistres ?? [], prescriptions ?? []));
    }).finally(() => setClientLoading(false));
  }, [isClient, user]);

  const fetchPrestataireData = useCallback(() => {
    if (!isPrestataire) return;
    setPrestataireLoading(true);
    Promise.all([
      DataService.getConsultations().catch(() => []),
      DataService.getPrestations().catch(() => []),
      DataService.getPrescriptions().catch(() => []),
    ]).then(([consults, prests, prescripts]) => {
      setPrestataireData({
        prestataire:   contextPrestataire,
        consultations: Array.isArray(consults)   ? consults   : [],
        prestations:   Array.isArray(prests)     ? prests     : [],
        prescriptions: Array.isArray(prescripts) ? prescripts : [],
      });
    }).finally(() => setPrestataireLoading(false));
  }, [isPrestataire, contextPrestataire]);

  useEffect(() => { fetchStats(); fetchClientStats(); fetchPrestataireData(); }, [fetchStats, fetchClientStats, fetchPrestataireData]);

  // Redirect prestataire to onboarding if no linked prestataire record
  useEffect(() => {
    if (isPrestataire && !prestataireLoading && contextPrestataire === null) {
      navigate('/prestataire-onboarding', { replace: true });
    }
  }, [isPrestataire, prestataireLoading, contextPrestataire, navigate]);

  const triggerFlash = useCallback(() => {
    setLiveFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setLiveFlash(false), 1800);
  }, []);

  usePusherChannel(
    isAdmin ? CH.dashboard : null,
    {
      [EV.statsUpdate]: (data: unknown) => {
        setStats(prev => ({ ...prev, ...(data as StatsPayload) }));
        triggerFlash();
      },
      [EV.activityPush]: (data: unknown) => {
        const item = data as ActivityPayload;
        setStats(prev => ({
          ...prev,
          recentActivity: [item, ...prev.recentActivity].slice(0, 20),
        }));
      },
    },
    isAdmin && !loading,
  );

  // ── Loading (admin uniquement) ───────────────────────────────────────────
  if (loading && isAdmin) {
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

  // ── Error (admin uniquement) ─────────────────────────────────────────────
  if (apiError && isAdmin) {
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-dark transition-colors"
          >
            <RefreshCw size={15} /> Réessayer
          </button>
        </div>
      </AppLayout>
    );
  }

  // ── KPI data ─────────────────────────────────────────────────────────────
  const mainKpis: KpiCard[] = [
    {
      title: 'Assurés',
      value: stats.totalAssures.toLocaleString('fr-FR'),
      icon: <Users size={20} />,
      color: 'from-[#1B5299] to-[#2563BE]',
      bg: 'bg-blue-50',
    },
    {
      title: 'Contrats actifs',
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
      trend: stats.sinistresEnAttente > 0 ? { value: 'À traiter', up: false } : undefined,
    },
    {
      title: 'Montant remboursé',
      value: `${formatMontant(stats.montantRembourse)} FCFA`,
      icon: <Banknote size={20} />,
      color: 'from-[#1B5299] to-[#2563BE]',
      bg: 'bg-emerald-50',
    },
  ];

  const secondaryCards = [
    { title: 'Prestataires',    value: stats.totalPrestataires,  icon: <Stethoscope size={18} />, color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { title: 'Consultations',   value: stats.totalConsultations,  icon: <ClipboardList size={18} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Prescriptions',   value: stats.totalPrescriptions,  icon: <Pill size={18} />,        color: 'text-pink-600',   bg: 'bg-pink-50'   },
    { title: 'Total sinistres', value: stats.totalSinistres,      icon: <Activity size={18} />,    color: 'text-red-500',    bg: 'bg-red-50'    },
  ];

  const pieData = [
    { name: 'En attente', value: stats.sinistresEnAttente, color: PIE_COLORS[0] },
    { name: 'Approuvés',  value: stats.sinistresApprouves, color: PIE_COLORS[1] },
    { name: 'Payés',      value: stats.sinistresPaies,     color: PIE_COLORS[2] },
  ].filter(d => d.value > 0);

  const chartData = stats.chartData?.length > 0 ? stats.chartData : [];

  // Taux de remboursement global admin
  const tauxRembours = stats.totalSinistres > 0
    ? Math.round((stats.sinistresPaies / stats.totalSinistres) * 100)
    : 0;

  // Ratio S/P — injecté par StatsController via /dashboard/stats → ratioSP
  interface RatioPayload {
    ratio: number;
    sain: boolean;
    totalSinistres: number;
    totalPrimes: number;
  }

  const ratioSP = (stats as unknown as { ratioSP?: RatioPayload }).ratioSP;

  return (
    <AppLayout title="Tableau de bord">
      <div className="space-y-5 lg:space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <DashboardHeader
          user={user}
          onRefresh={() => {
            if (isAdmin)       fetchStats();
            if (isClient)      fetchClientStats();
            if (isPrestataire) fetchPrestataireData();
          }}
          liveFlash={liveFlash}
        />

        {/* ── Actions rapides (admin) ──────────────────────────────────── */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions rapides</p>
            <QuickActions navigate={navigate} />
          </motion.div>
        )}

        {/* ── Alertes admin ────────────────────────────────────────────── */}
        {isAdmin && <AdminAlerts stats={stats} />}

        {/* ════════════════════════════════════════════════════════════════
            SECTION ADMIN
        ════════════════════════════════════════════════════════════════ */}
        {isAdmin && (
          <>
            {/* ── KPI Bandeau ─────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Vue d'ensemble</p>
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {mainKpis.map((card, i) => (
                  <KpiCard key={card.title} card={card} delay={i * 0.07} />
                ))}
              </div>
            </div>

            {/* ── Compteurs secondaires ────────────────────────────────── */}
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

            {/* ── Analyse ─────────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Analyse</p>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

                {/* Bar chart sinistres & remboursements */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="lg:col-span-3 bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">Sinistres & Remboursements</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Évolution sur 6 mois</p>
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
                          <Bar dataKey="sinistres"      name="Sinistres"      fill="#3B82F6" radius={[4,4,0,0]} maxBarSize={40} />
                          <Bar dataKey="remboursements" name="Remboursements" fill="#8B5CF6" radius={[4,4,0,0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 sm:h-56 flex items-center justify-center text-muted-foreground text-sm">
                      Aucune donnée disponible
                    </div>
                  )}
                </motion.div>

                {/* Répartition + Taux */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42 }}
                    className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm flex-1"
                  >
                    <div className="mb-3">
                      <h3 className="font-semibold text-sm text-gray-900">Répartition des sinistres</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Total : {stats.totalSinistres}</p>
                    </div>
                    {pieData.length > 0 ? (
                      <>
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" paddingAngle={3} dataKey="value">
                                {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                              </Pie>
                              <Tooltip
                                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e5e7eb' }}
                                formatter={(val: number, name: string) => [
                                  `${val} (${stats.totalSinistres > 0 ? Math.round(val / stats.totalSinistres * 100) : 0}%)`, name,
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-1.5 mt-2">
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
                      <div className="flex flex-col items-center justify-center h-36 gap-2 text-muted-foreground">
                        <Activity size={28} className="opacity-30" />
                        <p className="text-xs">Aucun sinistre</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Taux de remboursement global */}
                  {isAdmin && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.48 }}
                      className="bg-card rounded-xl p-4 border border-border shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">Taux de remboursement</h3>
                          <p className="text-xs text-muted-foreground">Sinistres payés / total</p>
                        </div>
                        <span className="text-xl font-bold text-emerald-600">{tauxRembours}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${tauxRembours}%` }}
                          transition={{ duration: 0.8, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-green-400 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                        <span>Payés : {stats.sinistresPaies}</span>
                        <span>Total : {stats.totalSinistres}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Ratio S/P */}
                  {isAdmin && ratioSP && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.52 }}
                      className={`rounded-xl p-4 border shadow-sm ${ratioSP.sain ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">Ratio S/P</h3>
                          <p className="text-xs text-muted-foreground">Sinistres / Primes</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold ${ratioSP.sain ? 'text-emerald-600' : 'text-red-600'}`}>
                            {ratioSP.ratio}%
                          </span>
                          <p className={`text-[10px] font-semibold mt-0.5 ${ratioSP.sain ? 'text-emerald-600' : 'text-red-500'}`}>
                            {ratioSP.sain
                              ? <span className="flex items-center gap-0.5"><Check size={10} className="shrink-0" />Sain (&lt; 70%)</span>
                              : <span className="flex items-center gap-0.5"><WarningIcon size={10} className="shrink-0" />Élevé (≥ 70%)</span>
                            }
                          </p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden mt-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ratioSP.ratio)}%` }}
                          transition={{ duration: 0.8, delay: 0.55 }}
                          className={`h-full rounded-full ${ratioSP.sain ? 'bg-emerald-500' : 'bg-red-500'}`}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Opérationnel ────────────────────────────────────────── */}
            {isAdmin && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Opérationnel</p>
                <OperationalTable activities={stats.recentActivity} navigate={navigate} />
              </div>
            )}

            {/* ── Utilisateurs connectés ──────────────────────────────── */}
            {isAdmin && sessions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">En ligne maintenant</p>
                <ConnectedUsers sessions={sessions} />
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION PRESTATAIRE
        ════════════════════════════════════════════════════════════════ */}
        {isPrestataire && (
          <div className="space-y-5 lg:space-y-6">
            {/* Hero */}
            <PrestataireHeroSection data={prestataireData} navigate={navigate} />

            {/* KPIs */}
            <PrestataireKpiBandeau data={prestataireData} loading={prestataireLoading} />

            {/* Activité */}
            {!prestataireLoading && prestataireData && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Activité récente</p>
                <PrestataireActivity data={prestataireData} navigate={navigate} />
              </div>
            )}

            {/* Analytics */}
            {!prestataireLoading && prestataireData && (
              <PrestataireAnalytics data={prestataireData} />
            )}

            {/* Résumé prescriptions */}
            {!prestataireLoading && prestataireData && prestataireData.prescriptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                    <Pill size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">{prestataireData.prescriptions.length} prescription{prestataireData.prescriptions.length > 1 ? 's' : ''} créée{prestataireData.prescriptions.length > 1 ? 's' : ''}</p>
                    <p className="text-xs text-purple-700">Ordonnances enregistrées dans le système</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/prescriptions')}
                  className="text-sm font-semibold text-purple-700 bg-white border border-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors shrink-0"
                >
                  Voir tout
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            SECTION CLIENT
        ════════════════════════════════════════════════════════════════ */}
        {isClient && (
          <div className="space-y-6">
            {/* Hero Section */}
            <HeroSection user={user} clientType={clientType} navigate={navigate} />

            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <UniversalSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={() => {
                    const trimmed = searchQuery.trim();
                    setSearchSummary(trimmed || null);
                  }}
                />
                <ClientTypeSelector value={clientType} onChange={setClientType} />
              </div>

              {searchSummary ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="rounded-3xl border border-border bg-white p-4 text-sm text-slate-700 shadow-sm"
                >
                  <p className="font-semibold text-slate-900">Résultats pour « {searchSummary} »</p>
                  <p className="mt-1 text-xs text-muted-foreground">Utilisez les liens ci-dessous pour accéder rapidement aux informations recherchées.</p>
                </motion.div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                <SmartNotifications clientType={clientType} clientStats={clientStats} />
                <DigitalHealthCard user={user} clientStats={clientStats} />
              </div>

              <ClaimProgressTracker clientStats={clientStats} />
            </div>

            {/* Health Score */}
            <HealthScore clientStats={clientStats} />

            {/* Contextual Assistant */}
            <ContextualAssistant clientType={clientType} />

            {/* Action Priorities */}
            <ActionPriorities clientStats={clientStats} navigate={navigate} />

            {/* Smart Timeline */}
            <SmartTimeline activities={stats.recentActivity} />

            {/* Client Stats */}
            {clientLoading ? (
              <ClientLoadingSkeleton />
            ) : clientStats && (
              <>
                {/* KPI Personnels */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  {[
                    { title: 'Garanties actives',      value: clientStats.policesActives,    icon: <Shield size={20} />,       color: 'from-[#1B5299] to-[#2563BE]',     bg: 'bg-blue-50'   },
                    { title: 'Dossiers en cours',      value: clientStats.sinistresOuverts,  icon: <AlertTriangle size={20} />, color: 'from-orange-400 to-orange-500', bg: 'bg-orange-50' },
                    { title: 'Montant payé',           value: clientStats.montantRembourse >= 1000 ? `${(clientStats.montantRembourse/1000).toFixed(0)}k` : clientStats.montantRembourse, icon: <TrendingUp size={20} />, color: 'from-[#1B5299] to-[#2563BE]', bg: 'bg-emerald-50' },
                    { title: 'Ordonnances',            value: clientStats.prescriptions,     icon: <Pill size={20} />,          color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50' },
                  ].map((card, i) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.07 }}
                      className="bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border hover:shadow-md transition-shadow"
                    >
                      <div className={`p-2 rounded-lg ${card.bg} w-fit`}>
                        <span className={`bg-gradient-to-br ${card.color} bg-clip-text text-transparent`}>
                          {card.icon}
                        </span>
                      </div>
                      <p className="text-xl sm:text-3xl font-bold mt-3 text-gray-900 leading-none truncate">{card.value}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">{card.title}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Alert for pending claims */}
                {clientStats.sinistresEnAttente > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3"
                  >
                    <Clock size={16} className="text-yellow-600 mt-0.5 shrink-0" />
                    <div className="flex-1 text-sm text-yellow-800">
                      <span className="font-semibold">{clientStats.sinistresEnAttente} sinistre{clientStats.sinistresEnAttente > 1 ? 's' : ''} en attente</span>
                      {' '}de traitement. Vous serez notifié dès la mise à jour.
                    </div>
                  </motion.div>
                )}

                {/* Chart */}
                {clientStats.chartData.some(d => d.reclame > 0 || d.rembourse > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-card rounded-xl p-4 sm:p-5 border border-border shadow-sm"
                  >
                    <div className="mb-4">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">Historique des demandes</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Demandes payées vs en attente — 6 derniers mois</p>
                    </div>
                    <div className="h-44 sm:h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={clientStats.chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                            tickFormatter={v => Number(v) >= 1000 ? `${(Number(v)/1000).toFixed(0)}k` : String(v)} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                            formatter={(val: number) => [`${val.toLocaleString('fr-FR')} F`]}
                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                          />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="reclame"   name="Réclamé"   fill="#3B82F6" radius={[4,4,0,0]} maxBarSize={36} />
                          <Bar dataKey="rembourse" name="Remboursé" fill="#10B981" radius={[4,4,0,0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}

      </div>
      {isClient && <MobileQuickActionsBar navigate={navigate} />}
      {isPrestataire && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-[0_-1px_30px_rgba(15,23,42,0.05)] sm:hidden">
          <div className="mx-auto flex max-w-3xl justify-between px-4 py-3">
            {[
              { label: 'Consultations', icon: <ClipboardList size={18} />, route: '/consultations' },
              { label: 'Patients',      icon: <Users size={18} />,         route: '/mes-patients' },
              { label: 'Prescriptions', icon: <FileText size={18} />,      route: '/prescriptions' },
              { label: 'Prestations',   icon: <Pill size={18} />,          route: '/prestations' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.route)}
                className="inline-flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
