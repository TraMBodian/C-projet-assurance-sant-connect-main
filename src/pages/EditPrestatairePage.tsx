import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { DataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = {
  HOPITAL: "Hôpital",
  CLINIQUE: "Clinique",
  CABINET_MEDICAL: "Cabinet Médical",
  PHARMACIE: "Pharmacie",
  LABORATOIRE: "Laboratoire",
  AUTRE: "Autre",
};

const statutConfig = {
  ACTIF:    { label: "Actif",    bg: "bg-green-100 text-green-700 border-green-200" },
  INACTIF:  { label: "Inactif",  bg: "bg-gray-100 text-gray-600 border-gray-200" },
  SUSPENDU: { label: "Suspendu", bg: "bg-red-100 text-red-700 border-red-200" },
};

export default function EditPrestatairePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    numero: "",
    nom: "",
    type: "",
    telephone: "",
    email: "",
    adresse: "",
    statut: "ACTIF",
  });

  useEffect(() => {
    DataService.getPrestataires()
      .then((list: any[]) => {
        const found = list.find((p: any) => String(p.id) === String(id));
        if (!found) {
          toast({ title: "Introuvable", description: "Prestataire non trouvé.", variant: "destructive" });
          navigate('/prestataires');
          return;
        }
        setFormData({
          numero:    found.numero    ?? "",
          nom:       found.nom       ?? "",
          type:      found.type      ?? "",
          telephone: found.telephone ?? "",
          email:     found.email     ?? "",
          adresse:   found.adresse   ?? "",
          statut:    found.statut    ?? "ACTIF",
        });
      })
      .catch(() => {
        toast({ title: "Erreur", description: "Impossible de charger les données.", variant: "destructive" });
        navigate('/prestataires');
      })
      .finally(() => setLoadingData(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      toast({ title: "Champ requis", description: "Le nom est obligatoire.", variant: "destructive" });
      return;
    }
    if (!formData.type) {
      toast({ title: "Champ requis", description: "Veuillez sélectionner un type.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await DataService.updatePrestataire(id!, formData);
      toast({ title: "Modifications enregistrées", description: `${formData.nom} a été mis à jour.` });
      navigate('/prestataires');
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Impossible de mettre à jour.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  if (loadingData) {
    return (
      <AppLayout title="Modifier le prestataire">
        <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Modifier le prestataire" subHeader={
      <Button variant="outline" size="sm" onClick={() => navigate('/prestataires')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="flex items-start justify-center pt-4">
        <div className="w-full max-w-2xl space-y-4">

          {/* Statut actuel + changement rapide */}
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Statut du prestataire</p>
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${statutConfig[formData.statut as keyof typeof statutConfig]?.bg}`}>
                  {statutConfig[formData.statut as keyof typeof statutConfig]?.label ?? formData.statut}
                </span>
              </div>
              <div className="flex gap-2">
                {(["ACTIF", "INACTIF", "SUSPENDU"] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, statut: s }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      formData.statut === s
                        ? statutConfig[s].bg + " shadow-sm"
                        : "border-border text-muted-foreground hover:border-foreground/40 bg-card"
                    }`}
                  >
                    {statutConfig[s].label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Formulaire */}
          <Card className="p-6">
            <h2 className="text-base font-semibold mb-5 text-gray-900">Informations générales</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero">Numéro</Label>
                  <Input id="numero" value={formData.numero} onChange={set('numero')} className="mt-1.5" disabled />
                  <p className="text-xs text-muted-foreground mt-1">Le numéro ne peut pas être modifié.</p>
                </div>
                <div>
                  <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={set('type')}
                    className="w-full mt-1.5 px-3 py-2 border border-input rounded-lg bg-background text-sm"
                  >
                    <option value="">Sélectionner un type</option>
                    {Object.entries(typeLabels).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
                <Input id="nom" value={formData.nom} onChange={set('nom')} className="mt-1.5" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" type="tel" value={formData.telephone} onChange={set('telephone')} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={set('email')} className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" value={formData.adresse} onChange={set('adresse')} className="mt-1.5" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/prestataires')}>
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
