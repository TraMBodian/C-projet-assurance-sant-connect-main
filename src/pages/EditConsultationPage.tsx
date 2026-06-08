import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ChevronDown } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { DataService } from "@/services/dataService";
import { apiClient } from "@/services/apiClient";
import { useToast } from "@/hooks/use-toast";

export default function EditConsultationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consultation, setConsultation] = useState<any>(null);

  const [formData, setFormData] = useState({
    motif:      "",
    diagnostic: "",
    date:       "",
    heure:      "08:00",
    statut:     "PROGRAMMEE",
  });

  useEffect(() => {
    if (!id) return;
    DataService.getConsultation(id)
      .then((c: any) => {
        setConsultation(c);
        const dt = c.dateConsultation ? new Date(c.dateConsultation) : null;
        setFormData({
          motif:      c.motif      ?? "",
          diagnostic: c.diagnostic ?? "",
          date:       dt ? dt.toISOString().split("T")[0] : "",
          heure:      dt ? dt.toTimeString().slice(0, 5)  : "08:00",
          statut:     c.statut     ?? "PROGRAMMEE",
        });
      })
      .catch(() => toast({ title: "Erreur", description: "Consultation introuvable", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const dateConsultation = formData.date ? `${formData.date}T${formData.heure}:00` : undefined;
      await apiClient.updateConsultation(id, {
        assure:          { id: consultation?.assure?.id },
        prestataire:     { id: consultation?.prestataire?.id },
        motif:           formData.motif,
        diagnostic:      formData.diagnostic || null,
        dateConsultation,
        statut:          formData.statut,
      });
      toast({ title: "Consultation modifiée", description: "Les modifications ont été enregistrées" });
      navigate("/consultations");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message ?? "Impossible de modifier la consultation", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Modifier la consultation"
      subHeader={
        <Button size="sm" variant="outline" onClick={() => navigate("/consultations")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      }
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Chargement...</span>
            </div>
          ) : (
            <Card className="p-6">
              {consultation && (
                <div className="mb-4 pb-4 border-b border-border text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Assuré :</span> {consultation.assure?.nom} {consultation.assure?.prenom}</p>
                  <p><span className="font-medium text-foreground">Prestataire :</span> {consultation.prestataire?.nom}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Date et heure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heure">Heure</Label>
                    <Input
                      id="heure"
                      type="time"
                      value={formData.heure}
                      onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Statut */}
                <div>
                  <Label htmlFor="statut">Statut</Label>
                  <div className="relative mt-2">
                    <select
                      id="statut"
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                      className="w-full appearance-none px-3 py-2 pr-9 border border-input rounded-lg bg-background text-sm"
                    >
                      <option value="PROGRAMMEE">Programmée</option>
                      <option value="COMPLETEE">Effectuée</option>
                      <option value="ANNULEE">Annulée</option>
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Motif */}
                <div>
                  <Label htmlFor="motif">Motif de consultation *</Label>
                  <textarea
                    id="motif"
                    value={formData.motif}
                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                    required
                    className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background min-h-[80px] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Motif de la consultation..."
                  />
                </div>

                {/* Diagnostic */}
                <div>
                  <Label htmlFor="diagnostic">Diagnostic</Label>
                  <textarea
                    id="diagnostic"
                    value={formData.diagnostic}
                    onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background min-h-[80px] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Diagnostic établi (optionnel)..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 size={16} className="mr-2 animate-spin" />Enregistrement...</>
                  ) : (
                    "Enregistrer les modifications"
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
