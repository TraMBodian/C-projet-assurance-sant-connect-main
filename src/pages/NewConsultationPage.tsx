import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function NewConsultationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    assure: "",
    medecin: "",
    specialite: "",
    date: "",
    heure: "",
    motif: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Consultation créée avec succès !");
    navigate('/consultations');
  };

  return (
    <AppLayout title="Nouvelle consultation" subHeader={
      <Button size="sm" onClick={() => navigate('/consultations')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl space-y-6">

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="assure">Assuré</Label>
                <Input
                  id="assure"
                  value={formData.assure}
                  onChange={(e) => setFormData({...formData, assure: e.target.value})}
                  required
                  className="mt-2"
                  placeholder="Nom de l'assuré"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medecin">Médecin</Label>
                  <Input
                    id="medecin"
                    value={formData.medecin}
                    onChange={(e) => setFormData({...formData, medecin: e.target.value})}
                    required
                    className="mt-2"
                    placeholder="Dr. Nom"
                  />
                </div>
                <div>
                  <Label htmlFor="specialite">Spécialité</Label>
                  <select
                    id="specialite"
                    value={formData.specialite}
                    onChange={(e) => setFormData({...formData, specialite: e.target.value})}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="Médecin Généraliste">Médecin Généraliste</option>
                    <option value="Gynécologue">Gynécologue</option>
                    <option value="Ophtalmologue">Ophtalmologue</option>
                    <option value="Cardiologue">Cardiologue</option>
                    <option value="Pédiatre">Pédiatre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="heure">Heure</Label>
                  <Input
                    id="heure"
                    type="time"
                    value={formData.heure}
                    onChange={(e) => setFormData({...formData, heure: e.target.value})}
                    required
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="motif">Motif de consultation</Label>
                <textarea
                  id="motif"
                  value={formData.motif}
                  onChange={(e) => setFormData({...formData, motif: e.target.value})}
                  required
                  className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background min-h-[100px]"
                  placeholder="Décrivez le motif de la consultation..."
                />
              </div>

              <Button type="submit" className="w-full">
                Créer la consultation
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
