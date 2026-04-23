import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Shield, Edit, Trash2, Loader2, Save, X, Calendar, User, CreditCard, Briefcase, Heart } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataService } from "@/services/dataService";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const statutColor: Record<string, string> = {
  ACTIF:    "bg-green-100 text-green-700 border-green-200",
  SUSPENDU: "bg-amber-100 text-amber-700 border-amber-200",
  RESILIE:  "bg-red-100 text-red-700 border-red-200",
};

function fmtDate(d?: string) {
  if (!d) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("fr-FR");
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function AssureDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assure, setAssure] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!id) { setError("ID invalide"); setLoading(false); return; }
    DataService.getAssureById(id)
      .then(found => { setAssure(found); setForm(found ?? {}); })
      .catch(() => setError("Assuré introuvable"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field: string, value: string) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updated = await DataService.updateAssure(String(assure.id), form);
      setAssure(updated ?? form);
      setIsEditing(false);
      toast.success("Assuré mis à jour avec succès !");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Erreur lors de la mise à jour : " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer cet assuré ? Cette action est irréversible.")) return;
    try {
      await DataService.deleteAssure(String(assure.id));
      toast.success("Assuré supprimé.");
      navigate("/assures");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error("Erreur lors de la suppression : " + msg);
    }
  };

  if (loading) return (
    <AppLayout title="Chargement...">
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    </AppLayout>
  );

  if (error || !assure) return (
    <AppLayout title="Assuré introuvable" subHeader={
      <Button size="sm" onClick={() => navigate("/assures")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste
      </Button>
    }>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">{error ?? "Assuré non trouvé"}</p>
      </div>
    </AppLayout>
  );

  const statut = (assure.statut || "ACTIF").toUpperCase();
  const initiales = ((assure.prenom || "?")[0] + (assure.nom || "?")[0]).toUpperCase();

  const inp = (field: string, placeholder = "", type = "text") => (
    <Input
      type={type}
      value={form[field] ?? ""}
      onChange={e => set(field, e.target.value)}
      placeholder={placeholder}
      className="text-sm h-9"
    />
  );

  const sel = (field: string, options: { value: string; label: string }[]) => (
    <select
      value={form[field] ?? ""}
      onChange={e => set(field, e.target.value)}
      className="w-full px-3 py-2 text-sm h-9 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <AppLayout title={`${assure.prenom} ${assure.nom}`} subHeader={
      <Button size="sm" onClick={() => navigate("/assures")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="max-w-4xl space-y-5">

        {/* ── En-tête ── */}
        <div className="flex items-center justify-end flex-wrap gap-2">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="text-sm h-9">
                  <X className="w-4 h-4 mr-1.5" /> Annuler
                </Button>
                <Button onClick={handleUpdate} disabled={saving} className="text-sm h-9">
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="text-sm h-9">
                  <Edit className="w-4 h-4 mr-1.5" /> Modifier
                </Button>
                <Button variant="destructive" onClick={handleDelete} className="text-sm h-9">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Supprimer
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── Carte identité ── */}
        <Card className="p-5">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {initiales}
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Nom</Label>{inp("nom", "Diop")}</div>
                  <div><Label className="text-xs">Prénom</Label>{inp("prenom", "Moussa")}</div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{assure.prenom} {assure.nom}</h2>
                  <p className="text-muted-foreground font-mono text-sm mt-0.5">{assure.numero}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statutColor[statut] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      <Shield className="w-3 h-3" />
                      {statut.charAt(0) + statut.slice(1).toLowerCase()}
                    </span>
                    {assure.lien && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 border border-blue-200">
                        {assure.lien}
                      </span>
                    )}
                    {assure.type && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${assure.type.toUpperCase() === "FAMILLE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                        {assure.type.charAt(0).toUpperCase() + assure.type.slice(1).toLowerCase()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">

          {/* ── Données démographiques ── */}
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-blue-500" /> Données personnelles
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Date de naissance</Label>{inp("dateNaissance", "", "date")}</div>
                  <div><Label className="text-xs">Sexe</Label>{sel("sexe", [{ value: "M", label: "Masculin" }, { value: "F", label: "Féminin" }])}</div>
                </div>
                <div><Label className="text-xs">N° pièce d'identité</Label>{inp("pieceIdentite", "1234567890001")}</div>
                <div><Label className="text-xs">Téléphone</Label>{inp("telephone", "+221771234567", "tel")}</div>
                <div><Label className="text-xs">Email</Label>{inp("email", "exemple@email.com", "email")}</div>
                <div><Label className="text-xs">Adresse</Label>{inp("adresse", "Dakar, Sénégal")}</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Date de naissance" value={fmtDate(assure.dateNaissance)} />
                <InfoRow label="Sexe" value={assure.sexe === "M" ? "Masculin" : assure.sexe === "F" ? "Féminin" : assure.sexe} />
                <InfoRow label="N° pièce d'identité" value={assure.pieceIdentite} />
                <InfoRow label="Téléphone" value={assure.telephone} />
                <div className="col-span-2"><InfoRow label="Email" value={assure.email} /></div>
                <div className="col-span-2"><InfoRow label="Adresse" value={assure.adresse} /></div>
              </div>
            )}
          </Card>

          {/* ── Données d'assurance ── */}
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-purple-500" /> Données d'assurance
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <div><Label className="text-xs">Lien avec l'adhérent</Label>
                  {sel("lien", [
                    { value: "Principal", label: "Principal" },
                    { value: "Conjoint", label: "Conjoint(e)" },
                    { value: "Enfant", label: "Enfant" },
                    { value: "Autre", label: "Autre" },
                  ])}
                </div>
                <div><Label className="text-xs">Date d'adhésion</Label>{inp("dateAdhesion", "", "date")}</div>
                <div><Label className="text-xs">Salaire (FCFA)</Label>{inp("salaire", "500000")}</div>
                <div><Label className="text-xs">Garantie</Label>
                  {sel("garantie", [
                    { value: "Standard", label: "Standard" },
                    { value: "Premium", label: "Premium" },
                    { value: "Gold", label: "Gold" },
                  ])}
                </div>
                <div><Label className="text-xs">Statut</Label>
                  {sel("statut", [
                    { value: "ACTIF", label: "Actif" },
                    { value: "SUSPENDU", label: "Suspendu" },
                    { value: "RESILIE", label: "Résilié" },
                  ])}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <InfoRow label="Numéro assuré" value={assure.numero} />
                <InfoRow label="Type" value={assure.type} />
                <InfoRow label="Lien" value={assure.lien} />
                <InfoRow label="Date d'adhésion" value={fmtDate(assure.dateAdhesion || assure.dateDebut)} />
                <InfoRow label="Salaire" value={assure.salaire ? `${Number(assure.salaire).toLocaleString("fr-FR")} F` : undefined} />
                <InfoRow label="Garantie" value={assure.garantie} />
                <InfoRow label="Prime" value={assure.prime ? `${Number(assure.prime).toLocaleString("fr-FR")} F` : undefined} />
                <InfoRow label="Date fin" value={fmtDate(assure.dateFin)} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
