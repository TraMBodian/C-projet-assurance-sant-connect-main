import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Calendar, FileText, Banknote, Download,
  Loader2, Upload, Trash2, CheckCircle, Clock, XCircle, AlertTriangle,
  RefreshCw,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataService } from "@/services/dataService";
import { apiClient } from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Breadcrumb from "@/components/admin/Breadcrumb";

// ─── Types & helpers ─────────────────────────────────────────────────────────

const STATUTS: { value: string; label: string; icon: React.ReactNode; style: string }[] = [
  { value: "EN_ATTENTE", label: "En attente",  icon: <Clock size={14} />,         style: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  { value: "EN_COURS",   label: "En cours",    icon: <AlertTriangle size={14} />, style: "bg-blue-100 text-blue-700 border-blue-300"       },
  { value: "APPROUVE",   label: "Approuvé",    icon: <CheckCircle size={14} />,   style: "bg-purple-100 text-purple-700 border-purple-300" },
  { value: "REJETE",     label: "Rejeté",      icon: <XCircle size={14} />,       style: "bg-red-100 text-red-700 border-red-300"          },
  { value: "PAYE",       label: "Payé",        icon: <Banknote size={14} />,      style: "bg-green-100 text-green-700 border-green-300"    },
];

function statutConfig(statut: string) {
  return STATUTS.find(s => s.value === statut) ?? { label: statut, icon: null, style: "bg-gray-100 text-gray-700 border-gray-300" };
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SinistreDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [sinistre, setSinistre]       = useState<any>(null);
  const [documents, setDocuments]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // workflow
  const [newStatut, setNewStatut]     = useState("");
  const [montant, setMontant]         = useState("");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);

  // upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading]     = useState(false);

  // delete doc
  const [confirmDoc, setConfirmDoc]   = useState<any | null>(null);

  const loadData = async () => {
    if (!id) { setError("ID invalide"); setLoading(false); return; }
    try {
      const fetched = await DataService.getSinistreById(id);
      setSinistre(fetched);
      setNewStatut(fetched.statut ?? "EN_ATTENTE");
      if (fetched?.assure?.id) {
        apiClient.getDocumentsByAssure(fetched.assure.id)
          .then(docs => setDocuments(Array.isArray(docs) ? docs : []))
          .catch(() => setDocuments([]));
      }
    } catch {
      setError("Erreur lors du chargement du sinistre");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  // ── Changement de statut ───────────────────────────────────────────────────
  const handleStatutSave = async () => {
    if (!sinistre?.id) return;
    setSaving(true);
    try {
      const body: any = { statut: newStatut };
      if (montant) body.montantAccorde = Number(montant);
      if (notes)   body.notes = notes;
      const updated = await apiClient.request<any>(`/sinistres/${sinistre.id}/statut`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setSinistre(updated);
      setNotes("");
      setMontant("");
      toast.success("Statut mis à jour");
    } catch {
      toast.error("Impossible de mettre à jour le statut");
    } finally {
      setSaving(false);
    }
  };

  // ── Upload document ────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !sinistre?.assure?.id) return;
    setUploading(true);
    try {
      await apiClient.uploadDocument(file, {
        assureId: sinistre.assure.id,
        description: `Pièce sinistre ${sinistre.numero}`,
      });
      const docs = await apiClient.getDocumentsByAssure(sinistre.assure.id);
      setDocuments(Array.isArray(docs) ? docs : []);
      toast.success("Document joint avec succès");
    } catch {
      toast.error("Erreur lors de l'upload du document");
    } finally {
      setUploading(false);
    }
  };

  // ── Suppression document ───────────────────────────────────────────────────
  const handleDeleteDoc = async () => {
    if (!confirmDoc) return;
    try {
      await apiClient.deleteDocument(confirmDoc.id);
      setDocuments(prev => prev.filter(d => d.id !== confirmDoc.id));
      toast.success("Document supprimé");
    } catch {
      toast.error("Impossible de supprimer le document");
    } finally {
      setConfirmDoc(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center gap-3 text-muted-foreground h-48 justify-center">
          <Loader2 size={22} className="animate-spin" />
          <span>Chargement en cours…</span>
        </div>
      </AppLayout>
    );
  }

  if (error || !sinistre) {
    return <AppLayout><p className="text-muted-foreground">{error ?? "Sinistre non trouvé"}</p></AppLayout>;
  }

  const assureNom    = sinistre.assure ? `${sinistre.assure.nom ?? ""} ${sinistre.assure.prenom ?? ""}`.trim() : "—";
  const sc           = statutConfig(sinistre.statut);
  const needsMontant = newStatut === "APPROUVE" || newStatut === "PAYE";

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <Breadcrumb items={[
          { label: "Tableau de bord", path: "/dashboard" },
          { label: "Sinistres", path: "/sinistres" },
          { label: sinistre.numero ?? `Sinistre #${id}` },
        ]} />

        {/* En-tête */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Sinistre {sinistre.numero}</h1>
              <p className="text-muted-foreground">{sinistre.type}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${sc.style}`}>
              {sc.icon}
              {sc.label}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Assuré</p>
                  <p className="font-semibold">{assureNom}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date du sinistre</p>
                  <p className="font-semibold">{fmtDate(sinistre.dateSinistre)}</p>
                </div>
              </div>
              {sinistre.description && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{sinistre.description}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Montant réclamé</p>
                  <p className="font-bold text-xl">
                    {sinistre.montantReclamation != null ? `${Number(sinistre.montantReclamation).toLocaleString("fr-FR")} FCFA` : "—"}
                  </p>
                </div>
              </div>
              {sinistre.montantAccorde != null && (
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Montant accordé</p>
                    <p className="font-bold text-xl text-green-600">
                      {Number(sinistre.montantAccorde).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Workflow statuts — admin uniquement */}
        {isAdmin && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <RefreshCw size={16} />
              Gestion du workflow
            </h3>

            {/* Timeline statuts */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
              {STATUTS.map((s, i) => (
                <div key={s.value} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setNewStatut(s.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      newStatut === s.value ? s.style + " ring-2 ring-offset-1 ring-current" : "bg-muted text-muted-foreground border-border hover:border-current"
                    }`}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                  {i < STATUTS.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                </div>
              ))}
            </div>

            {/* Montant accordé si APPROUVE ou PAYE */}
            {needsMontant && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Montant accordé (FCFA) {newStatut === "APPROUVE" || newStatut === "PAYE" ? "*" : ""}
                </label>
                <input
                  type="number"
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  placeholder="Ex : 150000"
                  className="w-full max-w-xs px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-[#1B5299]/30"
                />
              </div>
            )}

            {/* Notes admin */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Ajouter une note interne…"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-[#1B5299]/30 resize-none"
              />
            </div>

            <button
              onClick={handleStatutSave}
              disabled={saving || newStatut === sinistre.statut}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B5299] text-white text-sm font-medium hover:bg-[#0F2D5A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Enregistrer le statut
            </button>
          </Card>
        )}

        {/* Documents */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Documents joints ({documents.length})</h3>
            {sinistre.assure?.id && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#1B5299] text-white hover:bg-[#0F2D5A] transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                Joindre un document
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="hidden"
            onChange={handleFileUpload}
          />

          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <FileText size={36} className="text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">Aucun document joint à ce dossier</p>
              <p className="text-xs text-muted-foreground">Utilisez le bouton ci-dessus pour joindre une pièce justificative</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.nom}</p>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                    )}
                    {doc.taille && (
                      <p className="text-xs text-muted-foreground">{(doc.taille / 1024).toFixed(0)} Ko</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-3 shrink-0">
                    <a
                      href={apiClient.getDocumentDownloadUrl(doc.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm" className="gap-1.5">
                        <Download size={13} />
                        Télécharger
                      </Button>
                    </a>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setConfirmDoc(doc)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <ConfirmDialog
          open={!!confirmDoc}
          title="Supprimer le document"
          description={`Supprimer définitivement « ${confirmDoc?.nom} » ?`}
          confirmLabel="Supprimer"
          destructive
          onConfirm={handleDeleteDoc}
          onCancel={() => setConfirmDoc(null)}
        />
      </div>
    </AppLayout>
  );
}
