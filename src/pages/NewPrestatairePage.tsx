import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { DataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

export default function NewPrestatairePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero: "",
    nom: "",
    type: "",
    telephone: "",
    email: "",
    adresse: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero.trim()) {
      toast({ title: "Champ requis", description: "Le numéro est obligatoire.", variant: "destructive" });
      return;
    }
    if (!formData.nom.trim()) {
      toast({ title: "Champ requis", description: "Le nom du prestataire est obligatoire.", variant: "destructive" });
      return;
    }
    if (!formData.type) {
      toast({ title: "Champ requis", description: "Veuillez sélectionner un type.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await DataService.createPrestataire(formData);
      toast({ title: "Prestataire créé", description: `${formData.nom} a été enregistré avec succès.` });
      navigate('/prestataires');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de créer le prestataire. Vérifiez que le numéro n'est pas déjà utilisé.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <AppLayout title="Nouveau prestataire" subHeader={
      <Button variant="outline" size="sm" onClick={() => navigate('/prestataires')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="flex items-start justify-center min-h-[calc(100vh-200px)] pt-4">
        <div className="w-full max-w-2xl space-y-6">
          <Card className="p-6">
            <h2 className="text-base font-semibold mb-5 text-gray-900">Informations du prestataire</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero">Numéro <span className="text-red-500">*</span></Label>
                  <Input id="numero" value={formData.numero} onChange={set('numero')} className="mt-1.5" placeholder="EX-001" />
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
                    <option value="HOPITAL">Hôpital</option>
                    <option value="CLINIQUE">Clinique</option>
                    <option value="CABINET_MEDICAL">Cabinet Médical</option>
                    <option value="PHARMACIE">Pharmacie</option>
                    <option value="LABORATOIRE">Laboratoire</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="nom">Nom du prestataire <span className="text-red-500">*</span></Label>
                <Input id="nom" value={formData.nom} onChange={set('nom')} className="mt-1.5" placeholder="Ex: Hôpital Principal de Dakar" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" type="tel" value={formData.telephone} onChange={set('telephone')} className="mt-1.5" placeholder="+221 77 123 45 67" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={set('email')} className="mt-1.5" placeholder="contact@prestataire.sn" />
                </div>
              </div>

              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" value={formData.adresse} onChange={set('adresse')} className="mt-1.5" placeholder="Ex: Avenue Cheikh Anta Diop, Dakar" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/prestataires')}>
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Création en cours..." : "Créer le prestataire"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
