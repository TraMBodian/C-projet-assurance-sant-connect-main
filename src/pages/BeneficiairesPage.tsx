import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Phone, Mail, Calendar, Shield, User, Heart, Star,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { DataService } from "@/services/dataService";
import {
  ClientPageHero, RefreshButton, KpiRow,
  SkeletonList, ErrorBanner, EmptyState, StatusBadge, PageWrapper,
} from "@/components/client/ClientPageComponents";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return d; }
}

function initials(nom: string, prenom: string) {
  return `${(prenom ?? "").charAt(0)}${(nom ?? "").charAt(0)}`.toUpperCase();
}

function lienIcon(lien?: string) {
  const l = lien?.toLowerCase() ?? "";
  if (l.includes("conjoint") || l.includes("épouse") || l.includes("epouse"))
    return <Heart size={13} />;
  if (l.includes("enfant") || l.includes("fils") || l.includes("fille"))
    return <Star size={13} />;
  if (l.includes("père") || l.includes("mere") || l.includes("parent"))
    return <Users size={13} />;
  return <User size={13} />;
}

// ─── BeneficiaireCard ─────────────────────────────────────────────────────────

function BeneficiaireCard({ b, index }: { b: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base shrink-0">
              {b.photo
                ? <img src={b.photo} alt="" className="w-11 h-11 rounded-full object-cover" />
                : initials(b.nom, b.prenom)
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">
                {b.prenom} {b.nom}
              </p>
              <p className="text-blue-100 text-xs flex items-center gap-1 mt-0.5">
                {lienIcon(b.lien)}
                <span>{b.lien ?? "Bénéficiaire"}</span>
              </p>
            </div>
            <StatusBadge status={b.statut ?? "ACTIF"} />
          </div>

          {/* Infos */}
          <div className="p-4 space-y-2">
            {b.dateNaissance && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={13} className="shrink-0" />
                <span>Né(e) le {formatDate(b.dateNaissance)}</span>
              </div>
            )}
            {b.sexe && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User size={13} className="shrink-0" />
                <span>
                  {b.sexe === "M" ? "Masculin" : b.sexe === "F" ? "Féminin" : b.sexe}
                </span>
              </div>
            )}
            {b.telephone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone size={13} className="shrink-0" />
                <span>{b.telephone}</span>
              </div>
            )}
            {b.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={13} className="shrink-0" />
                <span className="truncate">{b.email}</span>
              </div>
            )}

            {/* Couverture */}
            <div className="pt-2 mt-1 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield size={12} className="text-blue-500 shrink-0" />
                <span>
                  Couverture :{" "}
                  <span className="font-medium text-foreground">
                    {b.garantie ?? "Standard"}
                  </span>
                </span>
              </div>
              {b.numero && (
                <span className="text-xs font-mono text-muted-foreground">{b.numero}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BeneficiairesPage() {
  const [beneficiaires, setBeneficiaires] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await DataService.getMesBeneficiaires();
      setBeneficiaires(data);
    } catch (err: any) {
      setError(err?.message ?? "Impossible de charger les bénéficiaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const actifs    = beneficiaires.filter(b => b.statut?.toUpperCase() === "ACTIF").length;
  const conjoints = beneficiaires.filter(b => {
    const l = b.lien?.toLowerCase() ?? "";
    return l.includes("conjoint") || l.includes("épouse") || l.includes("epouse");
  }).length;
  const enfants = beneficiaires.filter(b => {
    const l = b.lien?.toLowerCase() ?? "";
    return l.includes("enfant") || l.includes("fils") || l.includes("fille");
  }).length;

  const kpis = [
    { label: "Total",     value: beneficiaires.length, color: "blue"   as const },
    { label: "Actifs",    value: actifs,               color: "green"  as const },
    { label: "Conjoints", value: conjoints,             color: "purple" as const },
    { label: "Enfants",   value: enfants,               color: "orange" as const },
  ];

  return (
    <AppLayout title="Mes Bénéficiaires">
      <PageWrapper>

        {/* Hero */}
        <ClientPageHero
          icon={<Users size={20} />}
          title="Mes Bénéficiaires"
          subtitle="Membres de votre famille couverts par votre contrat"
          action={<RefreshButton onClick={load} loading={loading} />}
        />

        {/* KPI */}
        {!loading && !error && beneficiaires.length > 0 && (
          <KpiRow items={kpis} />
        )}

        {/* États */}
        {loading && <SkeletonList count={3} cols={3} />}

        {!loading && error && (
          <ErrorBanner message={error} onRetry={load} />
        )}

        {!loading && !error && beneficiaires.length === 0 && (
          <EmptyState
            icon={<Users size={28} />}
            title="Aucun bénéficiaire enregistré"
            description="Votre contrat ne comporte pas encore de bénéficiaires, ou votre compte n'est pas lié à un contrat famille. Contactez votre gestionnaire pour toute mise à jour."
          />
        )}

        {/* Liste */}
        {!loading && !error && beneficiaires.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {beneficiaires.map((b, i) => (
                <BeneficiaireCard key={b.id ?? i} b={b} index={i} />
              ))}
            </div>

            {/* Note */}
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <Shield size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 leading-relaxed">
                Pour toute modification (ajout, retrait ou mise à jour d'un bénéficiaire),
                veuillez contacter votre gestionnaire ou utiliser le formulaire de contact.
              </p>
            </div>
          </>
        )}

      </PageWrapper>
    </AppLayout>
  );
}
