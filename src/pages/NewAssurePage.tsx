import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { DataService } from "@/services/dataService";

export default function NewAssurePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    numero: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    sexe: "M",
    pieceIdentite: "",
    telephone: "",
    email: "",
    adresse: "",
    lien: "Principal",
    dateAdhesion: "",
    salaire: "",
    garantie: "Standard",
    type: "FAMILLE",
    statut: "ACTIF",
  });

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.createAssure(formData);
      toast.success("Assuré créé avec succès !");
      navigate('/assures');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error("Erreur lors de la création de l'assuré : " + message);
    }
  };

  const field = (id: string, label: string, node: React.ReactNode) => (
    <div>
      <Label htmlFor={id} className="text-xs sm:text-sm font-medium">{label}</Label>
      <div className="mt-1 sm:mt-2">{node}</div>
    </div>
  );

  const inp = (id: string, placeholder = "", type = "text") => (
    <Input
      id={id}
      type={type}
      value={(formData as any)[id]}
      onChange={(e) => set(id, e.target.value)}
      placeholder={placeholder}
      className="text-xs sm:text-sm h-9 sm:h-10"
    />
  );

  const sel = (id: string, options: { value: string; label: string }[]) => (
    <select
      id={id}
      value={(formData as any)[id]}
      onChange={(e) => set(id, e.target.value)}
      className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm h-9 sm:h-10 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <AppLayout title="Nouvel assuré" subHeader={
      <Button size="sm" onClick={() => navigate('/assures')}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="w-full px-2 sm:px-0">
        <div className="flex justify-center">
          <div className="w-full max-w-3xl space-y-4 sm:space-y-6">

            <Card className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Numéro */}
                {field("numero", "Numéro *",
                  <Input id="numero" value={formData.numero} onChange={e => set("numero", e.target.value)}
                    required placeholder="ASS-2024-001" className="text-xs sm:text-sm h-9 sm:h-10" />
                )}

                {/* Identité */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {field("nom", "Nom *",
                    <Input id="nom" value={formData.nom} onChange={e => set("nom", e.target.value)}
                      required placeholder="Diop" className="text-xs sm:text-sm h-9 sm:h-10" />
                  )}
                  {field("prenom", "Prénom *",
                    <Input id="prenom" value={formData.prenom} onChange={e => set("prenom", e.target.value)}
                      required placeholder="Moussa" className="text-xs sm:text-sm h-9 sm:h-10" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {field("dateNaissance", "Date de naissance", inp("dateNaissance", "", "date"))}
                  {field("sexe", "Sexe", sel("sexe", [
                    { value: "M", label: "Masculin" },
                    { value: "F", label: "Féminin" },
                  ]))}
                  {field("pieceIdentite", "N° pièce d'identité", inp("pieceIdentite", "1234567890001"))}
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {field("telephone", "Téléphone",
                    <Input id="telephone" type="tel" value={formData.telephone}
                      onChange={e => set("telephone", e.target.value)}
                      placeholder="+221771234567" className="text-xs sm:text-sm h-9 sm:h-10" />
                  )}
                  {field("email", "Email",
                    <Input id="email" type="email" value={formData.email}
                      onChange={e => set("email", e.target.value)}
                      placeholder="moussa.diop@email.com" className="text-xs sm:text-sm h-9 sm:h-10" />
                  )}
                </div>

                {field("adresse", "Adresse", inp("adresse", "Dakar, Sénégal"))}

                {/* Assurance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {field("lien", "Lien avec l'adhérent", sel("lien", [
                    { value: "Principal", label: "Principal" },
                    { value: "Conjoint", label: "Conjoint(e)" },
                    { value: "Enfant", label: "Enfant" },
                    { value: "Autre", label: "Autre" },
                  ]))}
                  {field("dateAdhesion", "Date d'adhésion", inp("dateAdhesion", "", "date"))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {field("salaire", "Salaire (FCFA)", inp("salaire", "500000"))}
                  {field("garantie", "Garantie", sel("garantie", [
                    { value: "Standard", label: "Standard" },
                    { value: "Premium", label: "Premium" },
                    { value: "Gold", label: "Gold" },
                  ]))}
                  {field("type", "Type", sel("type", [
                    { value: "FAMILLE", label: "Famille" },
                    { value: "GROUPE", label: "Groupe" },
                  ]))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button type="submit" className="flex-1 h-9 sm:h-10 text-xs sm:text-sm font-medium">
                    Créer l'assuré
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/assures')}
                    className="flex-1 sm:flex-none h-9 sm:h-10 text-xs sm:text-sm">
                    Annuler
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
