import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function NewPrescriptionPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    assure: "",
    medecin: "",
    date: "",
    instructions: ""
  });
  const [medicaments, setMedicaments] = useState([
    { nom: "", dosage: "", duree: "" }
  ]);

  const addMedicament = () => {
    setMedicaments([...medicaments, { nom: "", dosage: "", duree: "" }]);
  };

  const removeMedicament = (index: number) => {
    setMedicaments(medicaments.filter((_, i) => i !== index));
  };

  const updateMedicament = (index: number, field: string, value: string) => {
    const updated = [...medicaments];
    updated[index] = { ...updated[index], [field]: value };
    setMedicaments(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Ordonnance créée avec succès !");
    navigate('/prescriptions');
  };

  return (
    <AppLayout title="Nouvelle ordonnance" subHeader={
      <Button size="sm" onClick={() => navigate('/prescriptions')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-3xl space-y-6">

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assure">Patient</Label>
                  <Input
                    id="assure"
                    value={formData.assure}
                    onChange={(e) => setFormData({...formData, assure: e.target.value})}
                    required
                    className="mt-2"
                    placeholder="Nom du patient"
                  />
                </div>
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
              </div>

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

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg">Médicaments</Label>
                  <Button type="button" onClick={addMedicament} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Ajouter
                  </Button>
                </div>

                <div className="space-y-4">
                  {medicaments.map((med, index) => (
                    <Card key={index} className="p-4 bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Nom du médicament"
                            value={med.nom}
                            onChange={(e) => updateMedicament(index, 'nom', e.target.value)}
                            required
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              placeholder="Dosage (ex: 1 comprimé 3x/jour)"
                              value={med.dosage}
                              onChange={(e) => updateMedicament(index, 'dosage', e.target.value)}
                              required
                            />
                            <Input
                              placeholder="Durée (ex: 7 jours)"
                              value={med.duree}
                              onChange={(e) => updateMedicament(index, 'duree', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        {medicaments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMedicament(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  required
                  className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background min-h-[100px]"
                  placeholder="Instructions particulières..."
                />
              </div>

              <Button type="submit" className="w-full">
                Créer l'ordonnance
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
