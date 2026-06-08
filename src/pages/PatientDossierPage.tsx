import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, AlertCircle, Stethoscope, Pill,
  Calendar, FileText, CheckCircle, Clock, X, Plus,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import { DocumentUpload, DocumentList } from "@/components/DocumentUpload";
import { apiClient } from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";

type Tab = "consultations" | "prescriptions" | "prestations" | "documents";

const STATUS_CFG: Record<string, { label: string; badge: string }> = {
  COMPLETEE:  { label: "Effectuée",  badge: "bg-green-100 border-green-200 text-green-700" },
  PROGRAMMEE: { label: "Programmée", badge: "bg-blue-100 border-blue-200 text-blue-700"   },
  ANNULEE:    { label: "Annulée",    badge: "bg-red-100 border-red-200 text-red-600"       },
};

export default function PatientDossierPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user } = useAuth();
  const canUpload = user?.role === "admin" || user?.role === "prestataire";

  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prestations,   setPrestations]   = useState<any[]>([]);
  const [documents,     setDocuments]     = useState<any[]>([]);
  const [activeTab,     setActiveTab]     = useState<Tab>("consultations");

  const assure = useMemo(() => {
    const c = consultations[0] ?? prescriptions[0];
    if (!c) return null;
    return c.assure ?? c.consultation?.assure ?? null;
  }, [consultations, prescriptions]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      DataService.getConsultations().catch(() => []),
      DataService.getPrescriptions().catch(() => []),
      DataService.getPrestations().catch(() => []),
      apiClient.getDocumentsByAssure(Number(id)).catch(() => []),
    ])
      .then(([consults, prescripts, prests, docs]) => {
        setConsultations((consults ?? []).filter((c: any) => String(c.assure?.id) === id));
        setPrescriptions((prescripts ?? []).filter((p: any) => String(p.consultation?.assure?.id) === id));
        setPrestations((prests ?? []).filter((p: any) => String(p.assure?.id) === id));
        setDocuments(docs ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const assureName = assure ? `${assure.nom} ${assure.prenom}` : `Patient #${id}`;
  const initiales  = assure ? `${assure.nom?.[0] ?? ""}${assure.prenom?.[0] ?? ""}`.toUpperCase() : "?";

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "consultations", label: "Consultations",  icon: <Stethoscope size={14} />, count: consultations.length },
    { key: "prescriptions", label: "Prescriptions",  icon: <Pill size={14} />,        count: prescriptions.length },
    { key: "prestations",   label: "Prestations",    icon: <FileText size={14} />,    count: prestations.length  },
    { key: "documents",     label: "Documents",      icon: <FileText size={14} />,    count: documents.length    },
  ];

  return (
    <AppLayout
      title="Dossier patient"
      subHeader={
        <Button size="sm" variant="outline" onClick={() => navigate("/mes-patients")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      }
    >
      <div className="max-w-3xl mx-auto space-y-5 px-4 sm:px-6">

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0F2D5A] via-[#1B5299] to-[#2563BE] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold shrink-0">
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-blue-100">Dossier patient</p>
              <h2 className="text-xl font-bold truncate">{assureName}</h2>
              {assure?.email && <p className="text-sm text-blue-100 mt-0.5 truncate">{assure.email}</p>}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: "Consultations", value: consultations.length },
              { label: "Prescriptions", value: prescriptions.length },
              { label: "Prestations",   value: prestations.length  },
              { label: "Documents",     value: documents.length     },
            ].map(k => (
              <div key={k.label} className="bg-white/15 rounded-lg px-2 py-2 text-center">
                <p className="text-lg font-bold">{k.value}</p>
                <p className="text-[10px] text-blue-100">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action rapide */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => navigate(`/consultations/new?assureId=${id}`)}
            className="flex items-center gap-1.5"
          >
            <Plus size={14} /> Nouvelle consultation
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === t.key ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-3 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <AlertCircle size={28} className="text-destructive opacity-60" />
            <p className="text-sm font-medium">Impossible de charger le dossier patient</p>
          </div>
        ) : (
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

            {activeTab === "consultations" && (
              consultations.length === 0 ? (
                <EmptyState icon={<Stethoscope size={32} />} label="Aucune consultation" />
              ) : (
                <div className="space-y-2">
                  {[...consultations]
                    .sort((a, b) => new Date(b.dateConsultation ?? 0).getTime() - new Date(a.dateConsultation ?? 0).getTime())
                    .map((c, i) => {
                      const cfg = STATUS_CFG[c.statut] ?? STATUS_CFG.ANNULEE;
                      return (
                        <div key={c.id ?? i} className="bg-card rounded-xl p-4 border border-border">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-medium text-sm">{c.motif || "Consultation"}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </div>
                          {c.dateConsultation && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Calendar size={11} />
                              {new Date(c.dateConsultation).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                            </p>
                          )}
                          {c.diagnostic && (
                            <p className="text-xs text-muted-foreground mt-1">Diag. : {c.diagnostic}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )
            )}

            {activeTab === "prescriptions" && (
              prescriptions.length === 0 ? (
                <EmptyState icon={<Pill size={32} />} label="Aucune prescription" />
              ) : (
                <div className="space-y-2">
                  {prescriptions.map((p, i) => (
                    <div key={p.id ?? i} className="bg-card rounded-xl p-4 border border-border">
                      <p className="font-medium text-sm">{p.medicament || "Ordonnance"}</p>
                      {p.posologie && <p className="text-xs text-muted-foreground mt-0.5">{p.posologie}</p>}
                      {p.createdAt && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Calendar size={11} />
                          {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === "prestations" && (
              prestations.length === 0 ? (
                <EmptyState icon={<FileText size={32} />} label="Aucune prestation" />
              ) : (
                <div className="space-y-2">
                  {prestations.map((p, i) => (
                    <div key={p.id ?? i} className="bg-card rounded-xl p-4 border border-border">
                      <p className="font-medium text-sm">{p.type || p.libelle || `Prestation #${p.id}`}</p>
                      {p.statut && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground mt-1 inline-block">
                          {p.statut}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === "documents" && (
              <div className="space-y-4">
                {canUpload && (
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-sm font-medium mb-3">Ajouter un document</p>
                    <DocumentUpload
                      assureId={Number(id)}
                      onUploaded={doc => setDocuments(prev => [doc, ...prev])}
                    />
                  </div>
                )}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <p className="text-sm font-medium mb-3">Documents ({documents.length})</p>
                  <DocumentList
                    documents={documents}
                    canDelete={user?.role === "admin"}
                    onDelete={async (docId) => {
                      await apiClient.deleteDocument(docId);
                      setDocuments(prev => prev.filter(d => d.id !== docId));
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-3 text-center text-muted-foreground opacity-50">
      {icon}
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
