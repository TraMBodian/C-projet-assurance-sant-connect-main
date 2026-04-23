import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, ChevronDown } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function NewConsultationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [assures, setAssures] = useState<any[]>([]);
  const [prestataires, setPrestataires] = useState<any[]>([]);
  const [selectedAssure, setSelectedAssure] = useState<any>(null);
  const [selectedPrestataire, setSelectedPrestataire] = useState<any>(null);
  const [assureSearch, setAssureSearch] = useState("");
  const [showAssureDropdown, setShowAssureDropdown] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    motif: "",
    diagnostic: "",
    date: new Date().toISOString().split("T")[0],
    heure: "08:00",
    statut: "COMPLETEE",
  });

  useEffect(() => {
    Promise.all([DataService.getAssures(), DataService.getPrestataires()])
      .then(([assureList, prestataireList]) => {
        setAssures(assureList ?? []);
        setPrestataires(prestataireList ?? []);
        const myPrestataire = (prestataireList ?? []).find(
          (p: any) => p.email?.toLowerCase() === user?.email?.toLowerCase()
        );
        if (myPrestataire) setSelectedPrestataire(myPrestataire);
      })
      .catch(() =>
        toast({ title: "Erreur de chargement", description: "Impossible de charger les données", variant: "destructive" })
      )
      .finally(() => setInitLoading(false));
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAssureDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredAssures = assures.filter((a) => {
    const q = assureSearch.toLowerCase();
    return (
      a.nom?.toLowerCase().includes(q) ||
      a.prenom?.toLowerCase().includes(q) ||
      (a.numeroAssure ?? "").toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssure) {
      toast({ title: "Assuré requis", description: "Veuillez sélectionner un assuré", variant: "destructive" });
      return;
    }
    if (!selectedPrestataire) {
      toast({ title: "Prestataire requis", description: "Veuillez sélectionner un prestataire", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const dateConsultation = `${formData.date}T${formData.heure}:00`;
      await DataService.createConsultation({
        assure: { id: selectedAssure.id },
        prestataire: { id: selectedPrestataire.id },
        motif: formData.motif,
        diagnostic: formData.diagnostic || null,
        dateConsultation,
        statut: formData.statut,
      });
      toast({ title: "Consultation créée", description: "La consultation a été enregistrée avec succès" });
      navigate("/consultations");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message ?? "Impossible de créer la consultation",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="Nouvelle consultation"
      subHeader={
        <Button size="sm" variant="outline" onClick={() => navigate("/consultations")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      }
    >
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl space-y-6">
          {initLoading ? (
            <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm">Chargement des données...</span>
            </div>
          ) : (
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Assuré avec autocomplete */}
                <div ref={dropdownRef} className="relative">
                  <Label htmlFor="assure-search">Assuré *</Label>
                  <div className="relative mt-2">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="assure-search"
                      value={selectedAssure ? `${selectedAssure.nom} ${selectedAssure.prenom}` : assureSearch}
                      onChange={(e) => {
                        setAssureSearch(e.target.value);
                        setSelectedAssure(null);
                        setShowAssureDropdown(true);
                      }}
                      onFocus={() => setShowAssureDropdown(true)}
                      placeholder="Rechercher un assuré..."
                      className="pl-9"
                      autoComplete="off"
                    />
                    {selectedAssure && (
                      <button
                        type="button"
                        onClick={() => { setSelectedAssure(null); setAssureSearch(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {showAssureDropdown && !selectedAssure && (
                    <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {filteredAssures.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-muted-foreground">Aucun assuré trouvé</div>
                      ) : (
                        filteredAssures.slice(0, 8).map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                            onClick={() => {
                              setSelectedAssure(a);
                              setAssureSearch("");
                              setShowAssureDropdown(false);
                            }}
                          >
                            <span className="font-medium">{a.nom} {a.prenom}</span>
                            {a.numeroAssure && (
                              <span className="ml-2 text-xs text-muted-foreground">#{a.numeroAssure}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Prestataire */}
                <div>
                  <Label htmlFor="prestataire">Prestataire *</Label>
                  <div className="relative mt-2">
                    <select
                      id="prestataire"
                      value={selectedPrestataire?.id ?? ""}
                      onChange={(e) => {
                        const p = prestataires.find((p: any) => String(p.id) === e.target.value);
                        setSelectedPrestataire(p ?? null);
                      }}
                      className="w-full appearance-none px-3 py-2 pr-9 border border-input rounded-lg bg-background text-sm"
                      required
                    >
                      <option value="">Sélectionner un prestataire</option>
                      {prestataires.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.nom}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Date et heure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heure">Heure *</Label>
                    <Input
                      id="heure"
                      type="time"
                      value={formData.heure}
                      onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                      required
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
                      <option value="COMPLETEE">Effectuée</option>
                      <option value="PROGRAMMEE">Programmée</option>
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
                    className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background min-h-[90px] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Décrivez le motif de la consultation..."
                  />
                </div>

                {/* Diagnostic */}
                <div>
                  <Label htmlFor="diagnostic">Diagnostic</Label>
                  <textarea
                    id="diagnostic"
                    value={formData.diagnostic}
                    onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background min-h-[90px] text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Diagnostic établi lors de la consultation (optionnel)..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Créer la consultation"
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
