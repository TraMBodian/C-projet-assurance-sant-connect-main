import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Lock, Settings } from "@/components/ui/Icons";
import { Shield, FileText, AlertTriangle, CreditCard, Calendar, TrendingUp, Stethoscope, Building2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import { PhotoUpload } from "@/components/PhotoUpload";
import { getTarifs, saveTarifs, TARIF_DEFAULTS, type TarifSettings } from "@/services/tarifService";
import { DataService } from "@/services/dataService";

function formatDate(d?: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }); }
  catch { return d; }
}

export default function AdminProfilePage() {
  const { user, updatePhoto, updateUser, myPrestataire: contextPrestataire } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const isAdmin       = user?.role === 'admin';
  const isClient      = user?.role === 'client';
  const isPrestataire = user?.role === 'prestataire';

  // ── Données assuré (CLIENT uniquement) ──────────────────────────────────────
  const [assure,   setAssure]   = useState<any>(null);
  const [polices,  setPolices]  = useState<any[]>([]);
  const [sinistres, setSinistres] = useState<any[]>([]);
  const [loadingAssure, setLoadingAssure] = useState(false);

  // ── Données prestataire (PRESTATAIRE uniquement) ─────────────────────────────
  const myPrestataire = contextPrestataire;
  const [prestataireStats, setPrestataireStats] = useState({ consultations: 0, prestationsFournies: 0, prestationsEnAttente: 0, prescriptions: 0 });
  const [loadingPrestataire, setLoadingPrestataire] = useState(false);

  useEffect(() => {
    if (!isClient) return;
    setLoadingAssure(true);
    Promise.all([
      DataService.getAssures(),
      DataService.getPolices(),
      DataService.getSinistres(),
    ])
      .then(([assures, pol, sin]) => {
        setAssure(assures[0] ?? null);
        setPolices(pol);
        setSinistres(sin);
      })
      .catch(() => {})
      .finally(() => setLoadingAssure(false));
  }, [isClient]);

  useEffect(() => {
    if (!isPrestataire) return;
    setLoadingPrestataire(true);
    Promise.all([
      DataService.getConsultations().catch(() => []),
      DataService.getPrestations().catch(() => []),
      DataService.getPrescriptions().catch(() => []),
    ])
      .then(([consults, prests, prescripts]) => {
        const consArr  = Array.isArray(consults)  ? consults  : [];
        const prestArr = Array.isArray(prests)     ? prests    : [];
        const prescArr = Array.isArray(prescripts) ? prescripts : [];
        setPrestataireStats({
          consultations:        consArr.length,
          prestationsFournies:  prestArr.filter((p: any) => p.statut === 'FOURNIE').length,
          prestationsEnAttente: prestArr.filter((p: any) => p.statut === 'EN_ATTENTE').length,
          prescriptions:        prescArr.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoadingPrestataire(false));
  }, [isPrestataire]);

  const [formData, setFormData] = useState({
    nom:       user?.full_name?.split(' ').slice(1).join(' ') || "",
    prenom:    user?.full_name?.split(' ')[0] || "",
    email:     user?.email || "",
    telephone: user?.telephone || "",
    adresse:   user?.adresse || "",
    role:      user?.role === 'admin' ? 'Administrateur' : user?.role === 'prestataire' ? 'Prestataire' : 'Client',
  });

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || 'AD';
  const [photo, setPhoto] = useState<string | undefined>(user?.photo);

  const handlePhotoChange = (base64: string) => {
    setPhoto(base64);
    updatePhoto(base64);
  };
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const fullName = `${formData.prenom} ${formData.nom}`.trim();
      await apiClient.request(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName,
          telephone: formData.telephone,
          adresse:   formData.adresse,
        }),
      });
      updateUser({ full_name: fullName, fullName });
      toast.success("Profil mis à jour avec succès");
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const [tarifs, setTarifs] = useState<TarifSettings>(TARIF_DEFAULTS);
  const [tarifEditing, setTarifEditing] = useState(false);
  const [tarifDraft,   setTarifDraft]   = useState<TarifSettings>(TARIF_DEFAULTS);
  const [tarifSaving,  setTarifSaving]  = useState(false);

  // Chargement initial des tarifs depuis la BDD
  useEffect(() => {
    if (!isAdmin) return;
    getTarifs().then(t => { setTarifs(t); setTarifDraft(t); });
  }, [isAdmin]);

  const handleTarifSave = async () => {
    const fields: (keyof TarifSettings)[] = [
      "primeEnfant", "primeAdulte", "primeAdulteAge", "tauxTaxe", "tauxCP", "tauxRemboursement",
      "plafondDentaire", "plafondOptique", "plafondHospitalisationJour",
      "plafondOrthophonie", "plafondMaterniteSimple", "plafondMaterniteGemellaire",
      "plafondMaterniteChirurgical", "plafondTransport",
    ];
    for (const f of fields) {
      if (isNaN(tarifDraft[f]) || tarifDraft[f] < 0) {
        toast.error("Veuillez saisir des valeurs numériques positives");
        return;
      }
    }
    setTarifSaving(true);
    try {
      await saveTarifs(tarifDraft);
      setTarifs(tarifDraft);
      setTarifEditing(false);
      toast.success("Paramètres tarifaires enregistrés en base");
    } catch {
      toast.error("Erreur lors de l'enregistrement des tarifs");
    } finally {
      setTarifSaving(false);
    }
  };

  const handleTarifReset = async () => {
    setTarifSaving(true);
    try {
      await saveTarifs({ ...TARIF_DEFAULTS });
      setTarifDraft({ ...TARIF_DEFAULTS });
      setTarifs({ ...TARIF_DEFAULTS });
      setTarifEditing(false);
      toast.success("Tarifs réinitialisés aux valeurs par défaut");
    } catch {
      toast.error("Erreur lors de la réinitialisation");
    } finally {
      setTarifSaving(false);
    }
  };

  const [changingPwd, setChangingPwd] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (!isStrongPassword(passwordData.new)) {
      toast.error(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }
    setChangingPwd(true);
    try {
      await apiClient.request(`/users/${user?.id}/change-password`, {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword:     passwordData.new,
        }),
      });
      toast.success("Mot de passe changé avec succès");
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du changement de mot de passe");
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Mon Profil</h1>

        <Card className="p-6">
          <div className="flex items-start gap-6 mb-6">
            <PhotoUpload
              photo={photo}
              onChange={handlePhotoChange}
              size="lg"
              initials={initials}
              label="Changer la photo"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{formData.prenom} {formData.nom}</h2>
              <p className="text-muted-foreground">{formData.role}</p>
              <p className="text-sm text-muted-foreground mt-1">{formData.email}</p>
            </div>
            {isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(false)} className="mr-2">
                Annuler
              </Button>
            )}
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={saving}
              className="btn-ripple"
            >
              {saving ? "Enregistrement…" : isEditing ? "Enregistrer" : "Modifier"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                Prénom
              </Label>
              <Input
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                Nom
              </Label>
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                Téléphone
              </Label>
              <Input
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                disabled={!isEditing}
                placeholder="+221771234567 ou +221 77 123 45 67"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                Adresse
              </Label>
              <Input
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Sécurité
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Mot de passe actuel</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              />
            </div>
            <div>
              <Label>Nouveau mot de passe</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              />
            </div>
            <div>
              <Label>Confirmer le mot de passe</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              />
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={changingPwd}
              className="btn-ripple"
            >
              {changingPwd ? "Modification…" : "Changer le mot de passe"}
            </Button>
          </div>
        </Card>

        {/* ── Section CLIENT : Fiche d'assuré ──────────────────────────────────── */}
        {isClient && (
          <>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Ma Carte d'Assuré
              </h3>

              {loadingAssure && (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/5" />
                </div>
              )}

              {!loadingAssure && !assure && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                  <AlertTriangle size={16} className="text-yellow-500" />
                  Aucun dossier d'assuré lié à votre compte. Contactez votre gestionnaire.
                </div>
              )}

              {!loadingAssure && assure && (() => {
                const policeActive = polices.find(p =>
                  (p.assureId === assure.id || p.assure?.id === assure.id) &&
                  p.statut?.toUpperCase() === "ACTIVE"
                ) ?? polices[0];

                const statutColor: Record<string, string> = {
                  ACTIF: "bg-green-100 text-green-700",
                  SUSPENDU: "bg-yellow-100 text-yellow-700",
                  RESILIE: "bg-red-100 text-red-700",
                };
                const statut = assure.statut?.toUpperCase() ?? "ACTIF";

                return (
                  <div className="space-y-5">
                    {/* Carte visuelle */}
                    <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 shadow-md">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-blue-200 uppercase tracking-wider mb-0.5">Assurance Santé</p>
                          <p className="text-lg font-bold">{assure.prenom} {assure.nom}</p>
                        </div>
                        <Shield size={28} className="text-white/70" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-mono text-sm tracking-widest text-blue-100">{assure.numero ?? "—"}</p>
                        <div className="flex items-center gap-3 text-xs text-blue-200 mt-2">
                          <span>{assure.lien ?? "Titulaire"}</span>
                          {assure.garantie && <><span>·</span><span>{assure.garantie}</span></>}
                        </div>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: <FileText size={15} className="text-muted-foreground" />, label: "Numéro adhérent", value: assure.numero ?? "—" },
                        { icon: <Shield size={15} className="text-muted-foreground" />,   label: "Garantie",        value: assure.garantie ?? "Standard" },
                        { icon: <Calendar size={15} className="text-muted-foreground" />, label: "Date d'adhésion", value: formatDate(assure.dateAdhesion ?? assure.createdAt) },
                        { icon: <CreditCard size={15} className="text-muted-foreground" />, label: "Statut",          value: <Badge className={`${statutColor[statut] ?? "bg-gray-100 text-gray-600"} border-0 text-xs`}>{statut}</Badge> },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40">
                          <span className="mt-0.5">{icon}</span>
                          <div>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-sm font-medium mt-0.5">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Police liée */}
                    {policeActive && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
                        <p className="font-semibold text-blue-800 mb-2">Police en cours</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-blue-700 text-xs">
                          <span>N° {policeActive.numero ?? policeActive.id}</span>
                          <span>Type : {policeActive.type ?? "—"}</span>
                          <span>Début : {formatDate(policeActive.dateDebut)}</span>
                          <span>Fin : {formatDate(policeActive.dateFin)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>

            {/* ── Statistiques CLIENT ────────────────────────────────────────────── */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Mes Statistiques
              </h3>
              {loadingAssure ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="animate-pulse h-20 bg-muted rounded-xl" />
                  ))}
                </div>
              ) : (() => {
                const policesActives  = polices.filter(p => p.statut?.toUpperCase() === "ACTIVE").length;
                const sinistresOuverts = sinistres.filter(s => ["OUVERT","EN_COURS","EN COURS"].includes(s.statut?.toUpperCase() ?? "")).length;
                const sinistresTotal   = sinistres.length;
                const totalRembourse  = sinistres
                  .filter(s => s.statut?.toUpperCase() === "REMBOURSÉ" || s.statut?.toUpperCase() === "REMBOURSE" || s.statut?.toUpperCase() === "CLOTURE")
                  .reduce((acc, s) => acc + (s.montantRembourse ?? s.montant ?? 0), 0);

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { value: polices.length.toString(),     label: "Polices",          color: "from-blue-50 to-blue-100",   text: "text-blue-700" },
                      { value: policesActives.toString(),      label: "Polices actives",  color: "from-green-50 to-green-100", text: "text-green-700" },
                      { value: sinistresTotal.toString(),      label: "Sinistres",        color: "from-orange-50 to-orange-100", text: "text-orange-700" },
                      {
                        value: sinistresOuverts > 0
                          ? sinistresOuverts.toString()
                          : totalRembourse > 0
                            ? `${(totalRembourse / 1000).toFixed(0)}k`
                            : "0",
                        label: sinistresOuverts > 0 ? "En cours" : "FCFA remboursés",
                        color: "from-purple-50 to-purple-100",
                        text:  "text-purple-700",
                      },
                    ].map(({ value, label, color, text }) => (
                      <div key={label} className={`text-center p-4 rounded-xl bg-gradient-to-br ${color}`}>
                        <p className={`text-2xl font-bold ${text}`}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </Card>
          </>
        )}

        {/* ── Section PRESTATAIRE : Fiche + Statistiques ──────────────────────── */}
        {isPrestataire && (
          <>
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                Ma Fiche Prestataire
              </h3>

              {loadingPrestataire && (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/5" />
                </div>
              )}

              {!loadingPrestataire && !myPrestataire && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                  <AlertTriangle size={16} className="text-yellow-500" />
                  Aucun prestataire lié à votre compte. Contactez l'administrateur.
                </div>
              )}

              {!loadingPrestataire && myPrestataire && (() => {
                const TYPE_LABELS: Record<string, string> = {
                  HOPITAL: 'Hôpital', CLINIQUE: 'Clinique', PHARMACIE: 'Pharmacie',
                  LABORATOIRE: 'Laboratoire', CABINET_MEDICAL: 'Cabinet médical', AUTRE: 'Autre',
                };
                const statutColor: Record<string, string> = {
                  ACTIF:    'bg-green-100 text-green-700',
                  INACTIF:  'bg-red-100 text-red-700',
                  SUSPENDU: 'bg-yellow-100 text-yellow-700',
                };
                const statut = (myPrestataire.statut ?? 'ACTIF').toUpperCase();

                return (
                  <div className="space-y-5">
                    {/* Carte visuelle */}
                    <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 shadow-md">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-blue-200 uppercase tracking-wider mb-0.5">
                            {TYPE_LABELS[myPrestataire.type] ?? myPrestataire.type ?? 'Prestataire'}
                          </p>
                          <p className="text-lg font-bold">{myPrestataire.nom}</p>
                        </div>
                        <Stethoscope size={28} className="text-white/70" />
                      </div>
                      <div className="space-y-1">
                        {myPrestataire.numero && (
                          <p className="font-mono text-sm tracking-widest text-blue-100">{myPrestataire.numero}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-blue-200 mt-2">
                          {myPrestataire.ville && <span>{myPrestataire.ville}</span>}
                          {myPrestataire.telephone && <><span>·</span><span>{myPrestataire.telephone}</span></>}
                        </div>
                      </div>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { icon: <Building2 size={15} className="text-muted-foreground" />, label: "Type d'établissement", value: TYPE_LABELS[myPrestataire.type] ?? myPrestataire.type ?? '—' },
                        { icon: <FileText size={15} className="text-muted-foreground" />,   label: "Numéro d'agrément",    value: myPrestataire.numero ?? '—' },
                        { icon: <ClipboardList size={15} className="text-muted-foreground" />, label: "Spécialité",        value: myPrestataire.specialite ?? myPrestataire.categorie ?? '—' },
                        { icon: <Shield size={15} className="text-muted-foreground" />,     label: "Statut",              value: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statutColor[statut] ?? 'bg-gray-100 text-gray-600'}`}>{statut}</span> },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40">
                          <span className="mt-0.5">{icon}</span>
                          <div>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="text-sm font-medium mt-0.5">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Adresse */}
                    {myPrestataire.adresse && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
                        <p className="font-semibold text-blue-800 mb-1">Adresse</p>
                        <p className="text-blue-700 text-xs">{myPrestataire.adresse}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>

            {/* ── Statistiques PRESTATAIRE ──────────────────────────────────────── */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Mes Statistiques
              </h3>
              {loadingPrestataire ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="animate-pulse h-20 bg-muted rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: prestataireStats.consultations.toString(),        label: "Consultations",        color: "from-blue-50 to-blue-100",       text: "text-blue-700" },
                    { value: prestataireStats.prestationsFournies.toString(),  label: "Prestations fournies", color: "from-blue-50 to-blue-100", text: "text-emerald-700" },
                    { value: prestataireStats.prestationsEnAttente.toString(), label: "En attente",           color: "from-orange-50 to-orange-100",   text: "text-orange-700" },
                    { value: prestataireStats.prescriptions.toString(),        label: "Prescriptions",        color: "from-purple-50 to-purple-100",   text: "text-purple-700" },
                  ].map(({ value, label, color, text }) => (
                    <div key={label} className={`text-center p-4 rounded-xl bg-gradient-to-br ${color}`}>
                      <p className={`text-2xl font-bold ${text}`}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {isAdmin && (
          <>
            {/* ── Paramètres Tarifaires ── */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Paramètres Tarifaires
                </h3>
                <div className="flex gap-2">
                  {tarifEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setTarifDraft(tarifs); setTarifEditing(false); }}>
                        Annuler
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleTarifReset} className="text-blue-600 border-blue-300 hover:bg-blue-50">
                        Réinitialiser
                      </Button>
                      <Button size="sm" onClick={handleTarifSave}>
                        Enregistrer
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => { setTarifDraft(tarifs); setTarifEditing(true); }}>
                      Modifier les tarifs
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* Primes par catégorie */}
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Primes annuelles par assuré (FCFA)
                  </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { key: "primeEnfant"    as const, label: "Prime Enfant",         sub: "< 18 ans",    color: "border-green-200 bg-green-50" },
                  { key: "primeAdulte"    as const, label: "Prime Adulte",         sub: "18 – 59 ans", color: "border-blue-200 bg-blue-50" },
                  { key: "primeAdulteAge" as const, label: "Prime Personne Âgée",  sub: "60 ans et +", color: "border-purple-200 bg-purple-50" },
                ].map(({ key, label, sub, color }) => (
                  <div key={key} className={`rounded-lg border p-4 ${color}`}>
                    <Label className="text-xs font-semibold">{label}</Label>
                    <p className="text-xs text-muted-foreground mb-2">{sub}</p>
                    {tarifEditing ? (
                      <Input
                        type="number"
                        min={0}
                        value={tarifDraft[key]}
                        onChange={e => setTarifDraft({ ...tarifDraft, [key]: Number(e.target.value) })}
                        className="bg-white"
                      />
                    ) : (
                      <p className="text-lg font-bold font-mono">
                        {tarifs[key].toLocaleString("fr-FR")} <span className="text-xs font-normal">FCFA</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Taux */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Taux applicables (%)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "tauxRemboursement" as const, label: "Taux de remboursement", sub: "Appliqué sur tous les actes", color: "border-green-200 bg-green-50" },
                  { key: "tauxCP"            as const, label: "Coût de police",        sub: "Appliqué sur la prime nette", color: "border-orange-200 bg-orange-50" },
                  { key: "tauxTaxe"          as const, label: "Taux de taxe",          sub: "Appliqué sur la prime nette", color: "border-gray-200 bg-gray-50" },
                ].map(({ key, label, sub, color }) => (
                  <div key={key} className={`rounded-lg border p-4 ${color}`}>
                    <Label className="text-xs font-semibold">{label}</Label>
                    <p className="text-xs text-muted-foreground mb-2">{sub}</p>
                    {tarifEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={tarifDraft[key]}
                          onChange={e => setTarifDraft({ ...tarifDraft, [key]: Number(e.target.value) })}
                          className="bg-white"
                        />
                        <span className="text-sm font-semibold">%</span>
                      </div>
                    ) : (
                      <p className="text-lg font-bold font-mono">
                        {tarifs[key].toFixed(1)} <span className="text-xs font-normal">%</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Plafonds de remboursement */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Plafonds de remboursement (FCFA)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { key: "plafondDentaire"            as const, label: "Soins dentaires",            sub: "Par bénéficiaire",      color: "border-blue-200 bg-blue-50" },
                  { key: "plafondOptique"              as const, label: "Optique",                    sub: "Par bénéficiaire",      color: "border-cyan-200 bg-cyan-50" },
                  { key: "plafondHospitalisationJour"  as const, label: "Hospitalisation — Clinique", sub: "Par jour",              color: "border-red-200 bg-red-50" },
                  { key: "plafondOrthophonie"          as const, label: "Orthophonie",                sub: "Par bénéficiaire / an", color: "border-pink-200 bg-pink-50" },
                  { key: "plafondMaterniteSimple"      as const, label: "Maternité — Simple",         sub: "Par évènement",         color: "border-rose-200 bg-rose-50" },
                  { key: "plafondMaterniteGemellaire"  as const, label: "Maternité — Gémellaire",     sub: "Par évènement",         color: "border-fuchsia-200 bg-fuchsia-50" },
                  { key: "plafondMaterniteChirurgical" as const, label: "Maternité — Chirurgical",    sub: "Par évènement",         color: "border-violet-200 bg-violet-50" },
                  { key: "plafondTransport"            as const, label: "Transport terrestre",        sub: "Par évènement",         color: "border-amber-200 bg-amber-50" },
                ] as const).map(({ key, label, sub, color }) => (
                  <div key={key} className={`rounded-lg border p-4 ${color}`}>
                    <Label className="text-xs font-semibold">{label}</Label>
                    <p className="text-xs text-muted-foreground mb-2">{sub}</p>
                    {tarifEditing ? (
                      <Input
                        type="number"
                        min={0}
                        value={tarifDraft[key]}
                        onChange={e => setTarifDraft({ ...tarifDraft, [key]: Number(e.target.value) })}
                        className="bg-white"
                      />
                    ) : (
                      <p className="text-lg font-bold font-mono">
                        {tarifs[key].toLocaleString("fr-FR")} <span className="text-xs font-normal">FCFA</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Résumé formule */}
            <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">Formule de calcul appliquée</p>
              <p className="text-xs space-y-0.5">
                Prime Nette = (Enfants × {tarifs.primeEnfant.toLocaleString("fr-FR")}) + (Adultes × {tarifs.primeAdulte.toLocaleString("fr-FR")}) + (Âgés × {tarifs.primeAdulteAge.toLocaleString("fr-FR")})<br />
                Coût de police = Prime Nette × {tarifs.tauxCP} %<br />
                Taxes = Prime Nette × {tarifs.tauxTaxe} %<br />
                <strong>Prime Totale = Prime Nette + Coût de police + Taxes</strong>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Statistiques</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "2 847", label: "Assurés gérés" },
              { value: "1 234", label: "Polices actives" },
              { value: "156",   label: "Sinistres traités" },
              { value: "45.2M", label: "FCFA remboursés" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
                <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </>
        )}
      </div>
    </AppLayout>
  );
}
