import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown } from "@/components/ui/Icons";

const TYPE_OPTIONS = [
  { value: "MEDICAMENT",      label: "Médicament"       },
  { value: "CONSULTATION",    label: "Consultation"     },
  { value: "ANALYSE",         label: "Analyse"          },
  { value: "HOSPITALISATION", label: "Hospitalisation"  },
  { value: "CHIRURGIE",       label: "Chirurgie"        },
  { value: "AUTRE",           label: "Autre"            },
];

interface Ligne {
  produitNom: string;
  quantite: string;
}

export default function NewPrestationPage() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { user }  = useAuth();

  const isPrestataire = user?.role === "prestataire";

  const [assures,     setAssures]     = useState<any[]>([]);
  const [prestataires, setPrestataires] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  const [assureId,             setAssureId]             = useState("");
  const [type,                 setType]                 = useState("MEDICAMENT");
  const [ordonnanceReference,  setOrdonnanceReference]  = useState("");
  const [prestataireDemandeurId, setPrestataireDemandeurId] = useState("");
  const [lignes,               setLignes]               = useState<Ligne[]>([{ produitNom: "", quantite: "1" }]);

  useEffect(() => {
    Promise.all([
      DataService.getAssures().catch(() => []),
      DataService.getPrestataires().catch(() => []),
    ]).then(([a, p]) => {
      setAssures(a ?? []);
      setPrestataires((p ?? []).filter((x: any) => x.statut === "ACTIF" || !x.statut));
    }).finally(() => setLoading(false));
  }, []);

  const addLigne = () => setLignes((prev) => [...prev, { produitNom: "", quantite: "1" }]);

  const removeLigne = (i: number) =>
    setLignes((prev) => prev.filter((_, idx) => idx !== i));

  const updateLigne = (i: number, field: keyof Ligne, value: string) =>
    setLignes((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assureId) {
      toast({ title: "Assuré requis", description: "Sélectionnez un assuré.", variant: "destructive" });
      return;
    }

    const validLignes = lignes.filter((l) => l.produitNom.trim());
    if (validLignes.length === 0) {
      toast({ title: "Ligne requise", description: "Ajoutez au moins une ligne de prestation.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const prestationPayload: any = {
        type,
        assure: { id: Number(assureId) },
        statut: "EN_ATTENTE",
        ...(ordonnanceReference.trim() ? { ordonnanceReference: ordonnanceReference.trim() } : {}),
        ...(prestataireDemandeurId ? { prestataireDemandeur: { id: Number(prestataireDemandeurId) } } : {}),
      };

      const created = await DataService.createPrestation(prestationPayload);
      const prestationId = String(created?.id ?? created?.data?.id);

      if (!prestationId || prestationId === "undefined") {
        throw new Error("Identifiant de prestation manquant dans la réponse");
      }

      // Créer les lignes une par une
      await Promise.all(
        validLignes.map((l) =>
          DataService.createLignePrestation(prestationId, {
            produitNom: l.produitNom.trim(),
            quantite:   parseInt(l.quantite) || 1,
            statut:     "EN_ATTENTE",
          })
        )
      );

      toast({ title: "Prestation créée", description: "La prestation a bien été enregistrée." });
      navigate("/prestations");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message ?? "Impossible de créer la prestation.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Nouvelle prestation">
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Nouvelle prestation">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/prestations")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Nouvelle prestation médicale</h1>
            <p className="text-sm text-muted-foreground">Renseignez les informations et ajoutez les lignes de prestation.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Informations générales */}
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-500">Informations générales</h2>

            {/* Assuré */}
            <div className="space-y-1.5">
              <Label htmlFor="assure">Assuré *</Label>
              <div className="relative">
                <select
                  id="assure"
                  value={assureId}
                  onChange={(e) => setAssureId(e.target.value)}
                  required
                  className="w-full appearance-none pl-3 pr-8 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Sélectionner un assuré…</option>
                  {assures.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.nom} {a.prenom} — {a.numero}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="type">Type de prestation *</Label>
              <div className="relative">
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Référence ordonnance */}
            <div className="space-y-1.5">
              <Label htmlFor="ref">Référence ordonnance (optionnel)</Label>
              <Input
                id="ref"
                placeholder="Ex : ORD-2024-001"
                value={ordonnanceReference}
                onChange={(e) => setOrdonnanceReference(e.target.value)}
              />
            </div>

            {/* Prestataire demandeur (admin uniquement) */}
            {!isPrestataire && (
              <div className="space-y-1.5">
                <Label htmlFor="demandeur">Prestataire demandeur (optionnel)</Label>
                <div className="relative">
                  <select
                    id="demandeur"
                    value={prestataireDemandeurId}
                    onChange={(e) => setPrestataireDemandeurId(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Aucun</option>
                    {prestataires.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} ({p.type})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}
          </Card>

          {/* Lignes de prestation */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-slate-500">
                Lignes de prestation
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addLigne} className="gap-1.5">
                <Plus size={14} />
                Ajouter une ligne
              </Button>
            </div>

            <div className="space-y-3">
              {lignes.map((ligne, i) => (
                <div key={i} className="flex items-end gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex-1 space-y-1.5">
                    <Label>Produit / Service *</Label>
                    <Input
                      placeholder="Ex : Amoxicilline 500mg, Consultation générale…"
                      value={ligne.produitNom}
                      onChange={(e) => updateLigne(i, "produitNom", e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-24 space-y-1.5">
                    <Label>Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(i, "quantite", e.target.value)}
                    />
                  </div>
                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLigne(i)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/prestations")}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement…</>
              ) : "Créer la prestation"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
