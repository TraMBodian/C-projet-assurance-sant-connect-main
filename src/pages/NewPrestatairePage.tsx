import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { DataService } from "@/services/dataService";

export default function NewPrestatairePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    type: "",
    telephone: "",
    email: "",
    adresse: "",
    numero: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.createPrestataire(formData);
      alert("Prestataire créé avec succès !");
      navigate('/prestataires');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert("Erreur lors de la création du prestataire");
    }
  };

  return (
    <AppLayout title="Nouveau prestataire" subHeader={
      <Button size="sm" onClick={() => navigate('/prestataires')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl space-y-6">

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="numero">Numéro</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({...formData, numero: e.target.value})}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="nom">Nom du prestataire</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  <option value="HOPITAL">Hôpital</option>
                  <option value="PHARMACIE">Pharmacie</option>
                  <option value="CLINIQUE">Clinique</option>
                  <option value="CABINET_MEDICAL">Cabinet Médical</option>
                  <option value="LABORATOIRE">Laboratoire</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  required
                  className="mt-2"
                  placeholder="+221771234567 ou +221 77 123 45 67"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  required
                  className="mt-2"
                />
              </div>

              <Button type="submit" className="w-full">
                Créer le prestataire
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
