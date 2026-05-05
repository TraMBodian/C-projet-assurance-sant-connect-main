import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Users, Building2 } from "@/components/ui/Icons";
import { Button } from "@/components/ui/button";
import PropositionFamilleForm from "./nouvelle-proposition/PropositionFamilleForm";
import PropositionGroupeForm  from "./nouvelle-proposition/PropositionGroupeForm";
import type { TypeProposition } from "./nouvelle-proposition/types";

// ─── Sélecteur de type ────────────────────────────────────────────────────────

function TypeSelector({ onSelect }: { onSelect: (t: TypeProposition) => void }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Nouvelle proposition</h2>
        <p className="text-muted-foreground">Choisissez le type de contrat à proposer</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <button
          type="button"
          onClick={() => onSelect("FAMILLE")}
          className="group p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left space-y-3"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-base">Maladie Famille</p>
            <p className="text-sm text-muted-foreground mt-1">
              Proposition individuelle ou familiale — souscripteur unique avec ayants droit
            </p>
          </div>
          <span className="inline-block text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            Contrat individuel
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelect("GROUPE")}
          className="group p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all text-left space-y-3"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-base">Maladie Groupe</p>
            <p className="text-sm text-muted-foreground mt-1">
              Proposition collective pour une entreprise — tarifs personnalisables par groupe
            </p>
          </div>
          <span className="inline-block text-xs font-medium bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">
            Contrat collectif
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewPropositionPage() {
  const navigate  = useNavigate();
  const [type, setType] = useState<TypeProposition | null>(null);

  const handleSaved = (propId: string) => {
    navigate("/admin/propositions", { state: { highlightId: propId } });
  };

  return (
    <AppLayout subHeader={
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => (type ? setType(null) : navigate(-1))}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {type ? "Changer de type" : "Retour"}
        </Button>
        {type && (
          <span className="text-sm text-muted-foreground">
            Proposition {type === "FAMILLE" ? "Famille" : "Groupe"}
          </span>
        )}
      </div>
    }>
      <div className="max-w-5xl mx-auto pb-10">
        {!type && <TypeSelector onSelect={setType} />}

        {type === "FAMILLE" && (
          <PropositionFamilleForm
            onBack={() => setType(null)}
            onSaved={handleSaved}
          />
        )}

        {type === "GROUPE" && (
          <PropositionGroupeForm
            onBack={() => setType(null)}
            onSaved={handleSaved}
          />
        )}
      </div>
    </AppLayout>
  );
}
