import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { User, Mail, Phone, MapPin, Lock, Camera, Settings } from "@/components/ui/Icons";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getTarifs, saveTarifs, TARIF_DEFAULTS, type TarifSettings } from "@/services/tarifService";

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: user?.full_name?.split(' ')[1] || "Utilisateur",
    prenom: user?.full_name?.split(' ')[0] || "",
    email: user?.email || "",
    telephone: "+221 77 527 97 27",
    adresse: "Rufisque Ouest, Cité Poste, Lot N°67",
    role: user?.role === 'admin' ? 'Administrateur' : user?.role === 'prestataire' ? 'Prestataire' : 'Client'
  });

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || 'AD';
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleSave = () => {
    toast.success("Profil mis à jour avec succès");
    setIsEditing(false);
  };

  const [tarifs, setTarifs] = useState<TarifSettings>(() => getTarifs());
  const [tarifEditing, setTarifEditing] = useState(false);
  const [tarifDraft,   setTarifDraft]   = useState<TarifSettings>(() => getTarifs());

  const handleTarifSave = () => {
    // Validation basique
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
    saveTarifs(tarifDraft);
    setTarifs(tarifDraft);
    setTarifEditing(false);
    toast.success("Paramètres tarifaires enregistrés");
  };

  const handleTarifReset = () => {
    setTarifDraft({ ...TARIF_DEFAULTS });
    saveTarifs({ ...TARIF_DEFAULTS });
    setTarifs({ ...TARIF_DEFAULTS });
    setTarifEditing(false);
    toast.success("Tarifs réinitialisés aux valeurs par défaut");
  };

  const handlePasswordChange = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    toast.success("Mot de passe changé avec succès");
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Mon Profil</h1>

        <Card className="p-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{formData.prenom} {formData.nom}</h2>
              <p className="text-muted-foreground">{formData.role}</p>
              <p className="text-sm text-muted-foreground mt-1">{formData.email}</p>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="btn-ripple"
            >
              {isEditing ? "Enregistrer" : "Modifier"}
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
              className="btn-ripple"
            >
              Changer le mot de passe
            </Button>
          </div>
        </Card>

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
                  <Button variant="outline" size="sm" onClick={handleTarifReset} className="text-amber-600 border-amber-300 hover:bg-amber-50">
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
                  { key: "plafondDentaire"            as const, label: "Soins dentaires",            sub: "Par bénéficiaire",      color: "border-teal-200 bg-teal-50" },
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
      </div>
    </AppLayout>
  );
}
