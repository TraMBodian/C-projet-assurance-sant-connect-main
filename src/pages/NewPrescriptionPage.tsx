import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { DataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

export default function NewPrescriptionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [consultations, setConsultations] = useState<any[]>([]);
  const [selectedConsultationId, setSelectedConsultationId] = useState("");
  const [initLoading, setInitLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [instructions, setInstructions] = useState("");
  const [medicaments, setMedicaments] = useState([{ nom: "", dosage: "", duree: "" }]);

  useEffect(() => {
    DataService.getConsultations()
      .then((list) => setConsultations(list ?? []))
      .catch(() =>
        toast({ title: "Erreur de chargement", description: "Impossible de charger les consultations", variant: "destructive" })
      )
      .finally(() => setInitLoading(false));
  }, []);

  const addMedicament = () => setMedicaments([...medicaments, { nom: "", dosage: "", duree: "" }]);

  const removeMedicament = (index: number) =>
    setMedicaments(medicaments.filter((_, i) => i !== index));

  const updateMedicament = (index: number, field: string, value: string) => {
    const updated = [...medicaments];
    updated[index] = { ...updated[index], [field]: value };
    setMedicaments(updated);
  };

  const consultationLabel = (c: any) => {
    const assureNom = c.assure ? `${c.assure.nom} ${c.assure.prenom}` : "Assuré inconnu";
    const date = c.dateConsultation
      ? new Date(c.dateConsultation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
      : "";
    return `${assureNom}${date ? ` — ${date}` : ""}${c.motif ? ` (${c.motif.slice(0, 40)})` : ""}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConsultationId) {
      toast({ title: "Consultation requise", description: "Veuillez sélectionner une consultation", variant: "destructive" });
      return;
    }

    const validMeds = medicaments.filter((m) => m.nom.trim() && m.dosage.trim() && m.duree.trim());
    if (validMeds.length === 0) {
      toast({ title: "Médicament requis", description: "Ajoutez au moins un médicament", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await Promise.all(
        validMeds.map((m) =>
          DataService.createPrescription({
            consultation: { id: Number(selectedConsultationId) },
            medicament: m.nom,
            dosage: m.dosage,
            duree: m.duree,
            instructions: instructions || null,
          })
        )
      );
      toast({
        title: "Ordonnance créée",
        description: `${validMeds.length} médicament${validMeds.length > 1 ? "s" : ""} enregistré${validMeds.length > 1 ? "s" : ""}`,
      });
      navigate("/prescriptions");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message ?? "Impossible de créer l'ordonnance",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Nouvelle ordonnance"
      subHeader={
        <Button size="sm" variant="outline" onClick={() => navigate("/prescriptions")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      }
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-3xl space-y-6">
          {initLoading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Chargement des consultations...</span>
            </div>
          ) : (
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Consultation liée */}
                <div>
                  <Label htmlFor="consultation">Consultation *</Label>
                  <div className="relative mt-2">
                    <select
                      id="consultation"
                      value={selectedConsultationId}
                      onChange={(e) => setSelectedConsultationId(e.target.value)}
                      className="w-full appearance-none px-3 py-2 pr-9 border border-input rounded-lg bg-background text-sm"
                      required
                    >
                      <option value="">Sélectionner une consultation</option>
                      {consultations.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {consultationLabel(c)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  {consultations.length === 0 && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Aucune consultation disponible.{" "}
                      <button
                        type="button"
                        className="text-primary underline"
                        onClick={() => navigate("/consultations/new")}
                      >
                        Créer une consultation d'abord
                      </button>
                    </p>
                  )}
                </div>

                {/* Médicaments */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base">Médicaments *</Label>
                    <Button type="button" onClick={addMedicament} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Ajouter
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {medicaments.map((med, index) => (
                      <Card key={index} className="p-4 bg-muted/30">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <Input
                              placeholder="Nom du médicament *"
                              value={med.nom}
                              onChange={(e) => updateMedicament(index, "nom", e.target.value)}
                              required
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                placeholder="Dosage (ex: 1 comprimé 3x/jour) *"
                                value={med.dosage}
                                onChange={(e) => updateMedicament(index, "dosage", e.target.value)}
                                required
                              />
                              <Input
                                placeholder="Durée (ex: 7 jours) *"
                                value={med.duree}
                                onChange={(e) => updateMedicament(index, "duree", e.target.value)}
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
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <Label htmlFor="instructions">Instructions générales</Label>
                  <textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background min-h-[90px] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Instructions particulières pour le patient (optionnel)..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Créer l'ordonnance"
                  )}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
