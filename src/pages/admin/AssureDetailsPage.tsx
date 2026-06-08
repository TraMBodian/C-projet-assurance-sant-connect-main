import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Edit, Trash2, Loader2, Save, X, User, Users } from "@/components/ui/Icons";
import Breadcrumb from "@/components/admin/Breadcrumb";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataService } from "@/services/dataService";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const statutColor: Record<string, string> = {
  ACTIF:    "bg-green-100 text-green-700 border-green-200",
  SUSPENDU: "bg-amber-100 text-amber-700 border-amber-200",
  RESILIE:  "bg-red-100 text-red-700 border-red-200",
};

/** Retourne un label précis en croisant lien + sexe */
function getLienLabel(lien: string, sexe?: string): string {
  const l = (lien || "").toLowerCase();
  const s = (sexe || "").toUpperCase();

  if (l === "conjoint" || l === "conjoint(e)" || l === "époux" || l === "épouse") {
    return s === "F" ? "Épouse" : s === "M" ? "Époux / Mari" : "Conjoint(e)";
  }
  if (l === "enfant" || l === "fils" || l === "fille") {
    return s === "F" ? "Fille" : s === "M" ? "Fils" : "Enfant";
  }
  if (l === "père" || l === "papa") return "Père";
  if (l === "mère" || l === "mama" || l === "maman") return "Mère";
  if (l === "frère") return "Frère";
  if (l === "sœur" || l === "soeur") return "Sœur";
  if (l === "grand-père" || l === "grand père") return "Grand-père";
  if (l === "grand-mère" || l === "grand mère") return "Grand-mère";
  if (l === "oncle") return "Oncle";
  if (l === "tante") return "Tante";
  // Valeur déjà précise ou non reconnue → on retourne telle quelle
  return lien || "—";
}

/** Couleur du badge selon le lien */
function getLienStyle(lien: string, sexe?: string): string {
  const l = (lien || "").toLowerCase();
  const s = (sexe || "").toUpperCase();
  if (l.includes("conjoint") || l.includes("épou") || l.includes("mari") || l.includes("femme")) {
    return "bg-pink-100 text-pink-700 border-pink-200";
  }
  if (l === "enfant" || l === "fils" || l === "fille") {
    return s === "F" ? "bg-green-100 text-green-700 border-green-200"
                     : "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (l === "père" || l === "mère" || l.includes("grand")) {
    return "bg-purple-100 text-purple-700 border-purple-200";
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
}

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
  const [dependants, setDependants] = useState<any[]>([]);
  const [principaux, setPrincipaux] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) { setError("ID invalide"); setLoading(false); return; }
    DataService.getAssureById(id)
      .then(found => {
        setAssure(found);
        setForm(found ?? {});
        // Charger la liste complète pour les dépendants et la sélection du principal en mode édition
        DataService.getAssures()
          .then(list => {
            setPrincipaux(
              list
                .filter((a: any) => (a.lien || "").toLowerCase() === "principal" && String(a.id) !== String(found?.id))
                .map((a: any) => ({ id: String(a.id), label: `${a.prenom} ${a.nom} — ${a.numero}` }))
            );
            if (found && (found.lien || "").toLowerCase() === "principal") {
              // Préfixe de famille : "FAM-3-0" → "FAM-3-" pour trouver "FAM-3-1", "FAM-3-2"…
              const m = (found.numero || "").match(/^(.+)-\d+$/);
              const familyPrefix = m ? m[1] + "-" : null;

              setDependants(
                list.filter((a: any) => {
                  if (String(a.id) === String(found.id)) return false;
                  // Lien explicite via assurePrincipalId
                  if (a.assurePrincipalId && String(a.assurePrincipalId) === String(found.id)) return true;
                  // Convention de numérotation : même préfixe, numéro différent du principal
                  if (familyPrefix && (a.numero || "").startsWith(familyPrefix) && a.numero !== found.numero) return true;
                  return false;
                })
              );
            }
          })
          .catch(() => {});
      })
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

  const handleDelete = () => setShowDeleteConfirm(true);

  const doDelete = async () => {
    setShowDeleteConfirm(false);
    try {
      await DataService.deleteAssure(String(assure.id));
      toast.success("Assuré supprimé.");
      navigate("/admin/assures");
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
      <Button size="sm" onClick={() => navigate("/admin/assures")}>
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
      <Button size="sm" onClick={() => navigate("/admin/assures")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="max-w-4xl mx-auto space-y-5 px-4 sm:px-6">
        <Breadcrumb items={[
          { label: "Accueil", path: "/dashboard" },
          { label: "Assurés", path: "/admin/assures" },
          { label: `${assure.prenom} ${assure.nom}` },
        ]} />

        {/* ── En-tête ── */}
        <div className="flex items-center justify-end flex-wrap gap-2">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="destructive" onClick={() => setIsEditing(false)} className="text-sm h-9">
                  <X className="w-4 h-4 mr-1.5" /> Annuler
                </Button>
                <Button onClick={handleUpdate} disabled={saving} className="text-sm h-9">
                  {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} className="text-sm h-9" style={{ background: "#1B5299" }}>
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0" style={{ background: "#1B5299" }}>
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
                {(form.lien || "").toLowerCase() !== "principal" && (
                  <div>
                    <Label className="text-xs">Assuré principal (rattachement)</Label>
                    <select
                      value={form.assurePrincipalId ?? ""}
                      onChange={e => set("assurePrincipalId", e.target.value)}
                      className="w-full px-3 py-2 text-sm h-9 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                    >
                      <option value="">— Sélectionner un principal —</option>
                      {principaux.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div><Label className="text-xs">Date d'adhésion</Label>{inp("dateAdhesion", "", "date")}</div>
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
                <InfoRow label="Garantie" value={assure.garantie} />
                <InfoRow label="Prime" value={assure.prime ? `${Number(assure.prime).toLocaleString("fr-FR")} F` : undefined} />
                <InfoRow label="Date fin" value={fmtDate(assure.dateFin)} />
              </div>
            )}
          </Card>
        </div>

        {/* ── Personnes assurées (dépendants) ── */}
        {(assure.lien || "").toLowerCase() === "principal" && (
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-green-500" />
              Personnes assurées rattachées
              {dependants.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  {dependants.length}
                </span>
              )}
            </h3>

            {dependants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                <Users className="w-8 h-8 opacity-20" />
                <p className="text-sm">Aucune personne assurée rattachée à ce principal</p>
                <p className="text-xs">Pour rattacher un assuré, créez-le avec le lien souhaité et sélectionnez ce principal.</p>
              </div>
            ) : (
              <div className="divide-y">
                {dependants.map(dep => {
                  const statut     = (dep.statut || "ACTIF").toUpperCase();
                  const lienLabel  = getLienLabel(dep.lien || "", dep.sexe);
                  const lienBadge  = getLienStyle(dep.lien || "", dep.sexe);
                  const avatarBg   = (dep.lien || "").toLowerCase().includes("enfant") || (dep.lien || "").toLowerCase() === "fils" || (dep.lien || "").toLowerCase() === "fille"
                    ? (dep.sexe === "F" ? "#16a34a" : "#2563eb")
                    : (dep.lien || "").toLowerCase().includes("conjoint") || (dep.lien || "").toLowerCase().includes("épou")
                      ? "#db2777"
                      : "#1B5299";

                  return (
                    <div
                      key={dep.id}
                      onClick={() => navigate(`/admin/assures/${dep.id}`)}
                      className="flex items-center gap-3 py-3 hover:bg-muted/40 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
                    >
                      {/* Avatar avec initiales */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: avatarBg }}
                      >
                        {((dep.prenom || dep.nom || "?")[0] || "?").toUpperCase()}
                      </div>

                      {/* Infos principale */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{dep.prenom} {dep.nom}</p>
                          {dep.lien && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${lienBadge}`}>
                              {lienLabel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-[11px] text-muted-foreground font-mono">{dep.numero}</p>
                          {dep.dateNaissance && (
                            <p className="text-[11px] text-muted-foreground">
                              Né{dep.sexe === "F" ? "e" : ""} le {fmtDate(dep.dateNaissance)}
                            </p>
                          )}
                          {dep.sexe && (
                            <p className="text-[11px] text-muted-foreground">
                              {dep.sexe === "M" ? "Masculin" : dep.sexe === "F" ? "Féminin" : dep.sexe}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Statut */}
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                        statut === "ACTIF"    ? "bg-green-100 text-green-700 border-green-200" :
                        statut === "SUSPENDU" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                               "bg-red-100 text-red-700 border-red-200"
                      }`}>
                        {statut.charAt(0) + statut.slice(1).toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ── Rattachement au principal (non-principal) ── */}
        {assure.assurePrincipalId && (assure.lien || "").toLowerCase() !== "principal" && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Assuré principal</p>
            <button
              onClick={() => navigate(`/admin/assures/${assure.assurePrincipalId}`)}
              className="text-sm text-blue-600 hover:underline font-medium flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5" /> Voir le dossier de l'assuré principal
            </button>
          </Card>
        )}

      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Supprimer l'assuré"
        description={`Supprimer définitivement "${assure?.prenom ?? ""} ${assure?.nom ?? ""}".trim() ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        destructive
        onConfirm={doDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AppLayout>
  );
}
