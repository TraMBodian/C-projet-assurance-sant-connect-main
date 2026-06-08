import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Loader2, AlertCircle, Shield, Pill, Banknote,
  FileText, Calendar, CheckCircle, Clock, Download,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { apiClient } from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import { PageWrapper } from "@/components/client/ClientPageComponents";
import { printAttestation } from "@/utils/attestation";

type Tab = "polices" | "prescriptions" | "prestations" | "documents";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700 border-green-200",
  EN_ATTENTE:"bg-yellow-100 text-yellow-700 border-yellow-200",
  PAYE:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  APPROUVE:  "bg-blue-100 text-blue-700 border-blue-200",
  REJETE:    "bg-red-100 text-red-700 border-red-200",
};

function Badge({ value }: { value: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[value] ?? "bg-muted text-muted-foreground border-border"}`}>
      {value}
    </span>
  );
}

function EmptyTab({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
      <div className="opacity-30">{icon}</div>
      <p className="font-semibold text-sm">{label}</p>
      {hint && <p className="text-xs max-w-xs">{hint}</p>}
    </div>
  );
}

export default function MonDossierPage() {
  const { user } = useAuth();
  const [activeTab,     setActiveTab]     = useState<Tab>("polices");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);
  const [polices,       setPolices]       = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prestations,   setPrestations]   = useState<any[]>([]);
  const [documents,     setDocuments]     = useState<any[]>([]);
  const [assureId,      setAssureId]      = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      DataService.getPolices().catch(() => [] as any[]),
      DataService.getPrescriptions().catch(() => [] as any[]),
      DataService.getPrestations().catch(() => [] as any[]),
      // Trouver l'assureId du client connecté via ses assurés
      apiClient.getAssures().catch(() => ({ assures: [] })),
    ]).then(([pols, prescs, prests, assuresRes]) => {
      setPolices(pols ?? []);
      setPrescriptions(prescs ?? []);
      setPrestations(prests ?? []);
      const assures: any[] = (assuresRes as any)?.assures ?? (Array.isArray(assuresRes) ? assuresRes : []);
      const myAssure = assures[0];
      if (myAssure?.id) {
        setAssureId(myAssure.id);
        apiClient.getDocumentsByAssure(myAssure.id)
          .then(docs => setDocuments(Array.isArray(docs) ? docs : []))
          .catch(() => setDocuments([]));
      }
    }).catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const kpis = useMemo(() => [
    { label: "Polices",       value: polices.length,       tab: "polices"       as Tab },
    { label: "Prescriptions", value: prescriptions.length, tab: "prescriptions" as Tab },
    { label: "Prestations",   value: prestations.length,   tab: "prestations"   as Tab },
    { label: "Documents",     value: documents.length,     tab: "documents"     as Tab },
  ], [polices.length, prescriptions.length, prestations.length, documents.length]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "polices",       label: "Mes Polices",       icon: <Shield size={14} />,   count: polices.length       },
    { key: "prescriptions", label: "Prescriptions",     icon: <Pill size={14} />,     count: prescriptions.length },
    { key: "prestations",   label: "Prestations",       icon: <Banknote size={14} />, count: prestations.length   },
    { key: "documents",     label: "Documents",         icon: <FileText size={14} />, count: documents.length     },
  ];

  return (
    <AppLayout title="Mon Dossier Santé">
      <PageWrapper>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] rounded-2xl p-5 text-white"
        >
          <p className="text-[10px] uppercase tracking-widest text-blue-100">Dossier personnel</p>
          <h2 className="text-2xl font-bold mt-1">Mon Dossier Santé</h2>
          <p className="text-sm text-blue-100 mt-1">
            {user?.full_name || user?.email || 'Mon compte'}
          </p>

          {/* KPI rapides */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {kpis.map(k => (
              <button
                key={k.label}
                onClick={() => setActiveTab(k.tab)}
                className={`rounded-xl px-2 py-2 text-center transition-colors ${
                  activeTab === k.tab ? "bg-white/30" : "bg-white/15 hover:bg-white/20"
                }`}
              >
                <p className="text-lg font-bold">{loading ? "—" : k.value}</p>
                <p className="text-[10px] text-blue-100 leading-tight">{k.label}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
            <AlertCircle size={32} className="text-destructive opacity-60" />
            <p className="text-sm font-medium">Impossible de charger votre dossier</p>
          </div>
        )}

        {!error && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                    activeTab === t.key
                      ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"
                  }`}
                >
                  {t.icon} {t.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                    activeTab === t.key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center h-40 gap-3 text-muted-foreground">
                <Loader2 size={22} className="animate-spin" />
                <span className="text-sm">Chargement de votre dossier…</span>
              </div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

                {/* Polices */}
                {activeTab === "polices" && (
                  polices.length === 0
                    ? <EmptyTab icon={<Shield size={40} />} label="Aucune police" hint="Contactez votre conseiller pour souscrire une couverture." />
                    : <div className="space-y-3">
                        {polices.map((p, i) => (
                          <div key={p.id ?? i} className="bg-card rounded-xl p-4 border border-border">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <p className="font-semibold text-sm">{p.numero ?? `Police #${p.id}`}</p>
                                {p.type && <p className="text-xs text-muted-foreground mt-0.5">{p.type}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge value={p.statut ?? "ACTIVE"} />
                                <button
                                  onClick={() => printAttestation({ ...p, assure: { nom: user?.full_name?.split(" ")[0] ?? "", prenom: user?.full_name?.split(" ").slice(1).join(" ") ?? "" } })}
                                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-[#1B5299] text-[#1B5299] hover:bg-[#1B5299] hover:text-white transition-colors"
                                  title="Télécharger l'attestation PDF"
                                >
                                  <Download size={10} />
                                  Attestation
                                </button>
                              </div>
                            </div>
                            {(p.dateDebut || p.dateEcheance) && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                                <Calendar size={11} />
                                {p.dateDebut && <span>Du {new Date(p.dateDebut).toLocaleDateString("fr-FR")}</span>}
                                {p.dateEcheance && <span>au {new Date(p.dateEcheance).toLocaleDateString("fr-FR")}</span>}
                              </div>
                            )}
                            {p.couverture && (
                              <p className="text-xs text-muted-foreground mt-1">Couverture : <span className="text-foreground font-medium">{p.couverture}</span></p>
                            )}
                          </div>
                        ))}
                      </div>
                )}

                {/* Prescriptions */}
                {activeTab === "prescriptions" && (
                  prescriptions.length === 0
                    ? <EmptyTab icon={<Pill size={40} />} label="Aucune prescription" hint="Vos ordonnances apparaîtront ici après une consultation." />
                    : <div className="space-y-3">
                        {prescriptions.map((p, i) => (
                          <div key={p.id ?? i} className="bg-card rounded-xl p-4 border border-border">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-medium text-sm">{p.medicament ?? "Ordonnance"}</p>
                              {p.statut && <Badge value={p.statut} />}
                            </div>
                            {p.dosage && <p className="text-xs text-muted-foreground">Dosage : {p.dosage}</p>}
                            {p.duree && <p className="text-xs text-muted-foreground">Durée : {p.duree}</p>}
                            {p.instructions && <p className="text-xs text-muted-foreground mt-1 italic">{p.instructions}</p>}
                            {p.createdAt && (
                              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                )}

                {/* Prestations */}
                {activeTab === "prestations" && (
                  prestations.length === 0
                    ? <EmptyTab icon={<Banknote size={40} />} label="Aucune prestation" hint="Les prises en charge de vos soins apparaîtront ici." />
                    : <div className="space-y-3">
                        {prestations.map((p, i) => {
                          const TYPE_FR: Record<string, string> = {
                            MEDICAMENT: "Médicament", CONSULTATION: "Consultation",
                            ANALYSE: "Analyse", HOSPITALISATION: "Hospitalisation",
                            CHIRURGIE: "Chirurgie", AUTRE: "Autre",
                          };
                          return (
                            <div key={p.id ?? i} className="bg-card rounded-xl p-4 border border-border">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-medium text-sm">{TYPE_FR[p.type] ?? p.type ?? `Prestation #${p.id}`}</p>
                                {p.statut && <Badge value={p.statut} />}
                              </div>
                              {p.montantTotal != null && (
                                <p className="text-xs text-muted-foreground">
                                  Montant : <span className="font-semibold text-foreground">{Number(p.montantTotal).toLocaleString("fr-FR")} FCFA</span>
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                )}

                {/* Documents */}
                {activeTab === "documents" && (
                  documents.length === 0
                    ? <EmptyTab icon={<FileText size={40} />} label="Aucun document" hint="Vos justificatifs et documents médicaux apparaîtront ici après dépôt." />
                    : <div className="space-y-2">
                        {documents.map((doc, i) => (
                          <div key={doc.id ?? i} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                              <FileText size={16} className="text-[#1B5299]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.nom}</p>
                              {doc.description && (
                                <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                              )}
                              {doc.createdAt && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Calendar size={10} />
                                  {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              )}
                            </div>
                            <a
                              href={apiClient.getDocumentDownloadUrl(doc.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-muted-foreground"
                              title="Télécharger"
                            >
                              <Download size={15} />
                            </a>
                          </div>
                        ))}
                      </div>
                )}

              </motion.div>
            )}
          </>
        )}
      </PageWrapper>
    </AppLayout>
  );
}
