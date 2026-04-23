import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Calendar, FileText, Banknote } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataService } from "@/services/dataService";
import { useState, useEffect } from "react";

export default function SinistreDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sinistre, setSinistre] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    const loadSinistre = async () => {
      if (!id) {
        setError('ID invalide');
        setLoading(false);
        return;
      }
      try {
        const fetched = await DataService.getSinistreById(id);
        setSinistre(fetched);
      } catch (err) {
        console.error('SinistreDetailsPage: impossible de charger le sinistre', err);
        setError('Erreur lors du chargement du sinistre');
      } finally {
        setLoading(false);
      }
    };
    loadSinistre();
  }, [id]);

  if (loading) {
    return <AppLayout title="Chargement...">Chargement en cours...</AppLayout>;
  }

  if (error || !sinistre) {
    return <AppLayout title="Sinistre introuvable"><p>{error ?? 'Sinistre non trouvé'}</p></AppLayout>;
  }

  return (
    <AppLayout title={`Sinistre ${sinistre.numero}`} subHeader={
      <Button size="sm" onClick={() => navigate('/sinistres')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="max-w-4xl space-y-6">

        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Sinistre {sinistre.numero}</h2>
              <p className="text-muted-foreground">{sinistre.type}</p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-info/10 text-info border border-info/20">
              {sinistre.statut}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Assuré</p>
                  <p className="font-semibold">{sinistre.assure}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date du sinistre</p>
                  <p className="font-semibold">{sinistre.date}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Montant réclamé</p>
                  <p className="font-semibold text-2xl">{sinistre.montantReclame}</p>
                </div>
              </div>
              {sinistre.montantValide && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Montant validé</p>
                    <p className="font-semibold text-2xl text-green-600">{sinistre.montantValide}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Documents joints</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Facture.pdf</span>
              <Button variant="ghost" size="sm">Télécharger</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Justificatif.pdf</span>
              <Button variant="ghost" size="sm">Télécharger</Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
