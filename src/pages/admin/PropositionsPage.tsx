import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Card }   from "@/components/ui/card";
import {
  Plus, Search, FileText, Building2, Users, Eye,
  Send, CheckCircle2, XCircle, ShieldCheck, Trash2,
  Clock, ArrowRight, Loader2, X,
} from "@/components/ui/Icons";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataService } from "@/services/dataService";
import type { Proposition, StatutProposition } from "./nouvelle-proposition/types";

// ─── Couleurs et libellés des statuts ─────────────────────────────────────────

const STATUT_STYLES: Record<StatutProposition, { label: string; bg: string; text: string; dot: string }> = {
  brouillon:  { label: "Brouillon",   bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400"   },
  envoyee:    { label: "Envoyée",     bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"   },
  acceptee:   { label: "Acceptée",    bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
  refusee:    { label: "Refusée",     bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
  convertie:  { label: "Convertie",   bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
};

// ─── Détail proposiiton ────────────────────────────────────────────────────────

function PropositionDetail({ prop }: { prop: Proposition }) {
  const d = prop.famille ?? prop.groupe;
  if (!prop.famille && !prop.groupe) return null;
  return (
    <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
      {prop.famille && (
        <>
          <p><strong>Souscripteur :</strong> {prop.famille.souscripteurNom}</p>
          <p>
            {prop.famille.nbAdultes > 0 && `${prop.famille.nbAdultes} adulte${prop.famille.nbAdultes > 1 ? "s" : ""}`}
            {prop.famille.nbEnfants > 0 && ` · ${prop.famille.nbEnfants} enfant${prop.famille.nbEnfants > 1 ? "s" : ""}`}
            {prop.famille.nbPersonnesAgees > 0 && ` · ${prop.famille.nbPersonnesAgees} âgé${prop.famille.nbPersonnesAgees > 1 ? "s" : ""}`}
            {" · "}{prop.famille.typeGarantie} · {prop.famille.dureeAns} an{prop.famille.dureeAns > 1 ? "s" : ""}
          </p>
          <p className="font-mono font-semibold text-blue-700">
            {prop.famille.primeEstimee.toLocaleString("fr-FR")} FCFA
          </p>
        </>
      )}
      {prop.groupe && (
        <>
          <p><strong>Entreprise :</strong> {prop.groupe.entreprise}</p>
          <p>
            {prop.groupe.nbAdultes > 0 && `${prop.groupe.nbAdultes} adulte${prop.groupe.nbAdultes > 1 ? "s" : ""}`}
            {prop.groupe.nbEnfants > 0 && ` · ${prop.groupe.nbEnfants} enfant${prop.groupe.nbEnfants > 1 ? "s" : ""}`}
            {prop.groupe.nbPersonnesAgees > 0 && ` · ${prop.groupe.nbPersonnesAgees} âgé${prop.groupe.nbPersonnesAgees > 1 ? "s" : ""}`}
            {" · "}{prop.groupe.dureeAns} an{prop.groupe.dureeAns > 1 ? "s" : ""}
            {(prop.groupe.tarifsPersoAdulte != null) && " · Tarifs personnalisés"}
          </p>
          <p className="font-mono font-semibold text-blue-700">
            {prop.groupe.primeEstimee.toLocaleString("fr-FR")} FCFA
          </p>
        </>
      )}
    </div>
  );
}

// ─── Ligne de la liste ────────────────────────────────────────────────────────

function PropositionRow({
  prop,
  isHighlighted,
  onAction,
  onDelete,
  onConvert,
}: {
  prop:           Proposition;
  isHighlighted:  boolean;
  onAction:       (id: string, statut: StatutProposition) => void;
  onDelete:       (id: string) => void;
  onConvert:      (id: string) => void;
}) {
  const s = STATUT_STYLES[prop.statut];
  const isGroupe  = prop.type === "GROUPE";
  const nom       = prop.famille?.souscripteurNom ?? prop.groupe?.entreprise ?? "—";
  const prime     = (prop.famille?.primeEstimee ?? prop.groupe?.primeEstimee ?? 0);

  return (
    <div className={`rounded-xl border transition-all ${isHighlighted ? "ring-2 ring-blue-400 border-blue-300 bg-blue-50/30" : "bg-white hover:bg-gray-50/60"}`}>
      <div className="flex items-start gap-4 p-4">
        {/* Icône type */}
        <div className={`mt-0.5 p-2.5 rounded-xl shrink-0 ${isGroupe ? "bg-purple-100" : "bg-blue-100"}`}>
          {isGroupe
            ? <Building2 className="w-4 h-4 text-purple-600" />
            : <Users     className="w-4 h-4 text-blue-600"   />}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm">{nom}</p>
            <span className="text-xs text-muted-foreground font-mono">{prop.reference}</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${isGroupe ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
              {isGroupe ? "Groupe" : "Famille"}
            </span>
          </div>
          <PropositionDetail prop={prop} />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Créée le {new Date(prop.createdAt).toLocaleDateString("fr-FR")}
            {prop.envoyeeAt  && ` · Envoyée le ${new Date(prop.envoyeeAt).toLocaleDateString("fr-FR")}`}
            {prop.accepteeAt && ` · Acceptée le ${new Date(prop.accepteeAt).toLocaleDateString("fr-FR")}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {prop.statut === "brouillon" && (
            <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => onAction(prop.id, "envoyee")}>
              <Send className="w-3.5 h-3.5" /> Envoyer
            </Button>
          )}
          {prop.statut === "envoyee" && (
            <>
              <Button size="sm" variant="outline" className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => onAction(prop.id, "acceptee")}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Accepter
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => onAction(prop.id, "refusee")}>
                <XCircle className="w-3.5 h-3.5" /> Refuser
              </Button>
            </>
          )}
          {prop.statut === "acceptee" && (
            <Button size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onConvert(prop.id)}>
              <ShieldCheck className="w-3.5 h-3.5" /> Créer la police
            </Button>
          )}
          {prop.statut === "convertie" && prop.policeId && (
            <span className="text-xs text-purple-700 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Police #{prop.policeId}
            </span>
          )}
          {(prop.statut === "brouillon" || prop.statut === "refusee") && (
            <button type="button" onClick={() => onDelete(prop.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTRES: { value: StatutProposition | "all"; label: string }[] = [
  { value: "all",       label: "Toutes"    },
  { value: "brouillon", label: "Brouillons" },
  { value: "envoyee",   label: "Envoyées"  },
  { value: "acceptee",  label: "Acceptées" },
  { value: "refusee",   label: "Refusées"  },
  { value: "convertie", label: "Converties"},
];

export default function PropositionsPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const highlightId = (location.state as any)?.highlightId ?? null;

  const [propositions, setPropositions] = useState<Proposition[]>([]);
  const [filtre,       setFiltre]       = useState<StatutProposition | "all">("all");
  const [search,       setSearch]       = useState("");
  const [converting,   setConverting]   = useState<string | null>(null);
  const [deleteId,     setDeleteId]     = useState<string | null>(null);

  useEffect(() => {
    setPropositions(DataService.getPropositions());
  }, []);

  const reload = () => setPropositions(DataService.getPropositions());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return propositions.filter(p => {
      if (filtre !== "all" && p.statut !== filtre) return false;
      if (!q) return true;
      const nom = p.famille?.souscripteurNom ?? p.groupe?.entreprise ?? "";
      return (
        nom.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q)
      );
    });
  }, [propositions, filtre, search]);

  const handleAction = (id: string, statut: StatutProposition) => {
    DataService.updatePropositionStatut(id, statut);
    reload();
    const labels: Record<string, string> = {
      envoyee:  "Proposition envoyée",
      acceptee: "Proposition acceptée",
      refusee:  "Proposition refusée",
    };
    toast.success(labels[statut] ?? "Statut mis à jour");
  };

  const handleConvert = async (id: string) => {
    setConverting(id);
    try {
      const prop = DataService.getPropositionById(id);
      if (!prop) throw new Error("Proposition introuvable");

      // Construire le payload police à partir des données de la proposition
      const policePayload = buildPolicePayload(prop);
      const police = await DataService.createPolice(policePayload);
      const policeId = String(police?.id ?? Date.now());

      // Marquer la proposition comme convertie
      DataService.updateProposition(id, { statut: "convertie", policeId });
      reload();
      toast.success(`Police créée avec succès — ${prop.reference}`);
      navigate(`/admin/polices`);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la création de la police");
    } finally {
      setConverting(null);
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    DataService.deleteProposition(deleteId);
    reload();
    setDeleteId(null);
    toast.success("Proposition supprimée");
  };

  // Compteurs par statut
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: propositions.length };
    for (const p of propositions) c[p.statut] = (c[p.statut] ?? 0) + 1;
    return c;
  }, [propositions]);

  return (
    <AppLayout subHeader={
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold">
          Propositions commerciales
          <span className="ml-2 text-muted-foreground font-normal">({propositions.length})</span>
        </p>
        <Button size="sm" onClick={() => navigate("/admin/nouvelle-proposition")}>
          <Plus className="w-4 h-4 mr-1.5" /> Nouvelle proposition
        </Button>
      </div>
    }>

      {/* Dialogue suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la proposition ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La proposition sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-5xl mx-auto space-y-5 pb-10">

        {/* ── Filtres de statut ── */}
        <div className="flex flex-wrap gap-2">
          {FILTRES.map(f => (
            <button key={f.value}
              onClick={() => setFiltre(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                filtre === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}>
              {f.label}
              {counts[f.value] != null && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filtre === f.value ? "bg-white/20" : "bg-gray-100"}`}>
                  {counts[f.value] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Recherche ── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou référence…"
            className="pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Liste ── */}
        {filtered.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-muted-foreground text-sm">
              {search || filtre !== "all"
                ? "Aucune proposition ne correspond à votre recherche"
                : "Aucune proposition pour l'instant"}
            </p>
            {!search && filtre === "all" && (
              <Button size="sm" onClick={() => navigate("/admin/nouvelle-proposition")}>
                <Plus className="w-4 h-4 mr-1.5" /> Créer une proposition
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(prop => (
              <PropositionRow
                key={prop.id}
                prop={prop}
                isHighlighted={prop.id === highlightId}
                onAction={handleAction}
                onDelete={setDeleteId}
                onConvert={handleConvert}
              />
            ))}
          </div>
        )}

        {converting && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <Card className="p-6 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="font-medium">Création de la police en cours…</p>
            </Card>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

// ─── Helpers : construction payload police ────────────────────────────────────

function buildPolicePayload(prop: Proposition): any {
  const now = new Date().toISOString().slice(0, 10);

  if (prop.famille) {
    const f = prop.famille;
    const nbTotal = f.nbAdultes + f.nbEnfants + f.nbPersonnesAgees;
    return {
      type:             "FAMILLE",
      souscripteurNom:  f.souscripteurNom,
      email:            f.souscripteurEmail,
      telephone:        f.souscripteurTel,
      adresse:          f.souscripteurAdresse,
      garantie:         f.typeGarantie,
      dateDebut:        f.dateDebut || now,
      dureeGarantie:    String(f.dureeAns),
      prime:            String(f.primeEstimee),
      tauxRemboursement: f.tauxRemboursement,
      nbAssures:        nbTotal,
      propositionRef:   prop.reference,
      statut:           "Actif",
    };
  }

  if (prop.groupe) {
    const g = prop.groupe;
    const nbTotal = g.nbAdultes + g.nbEnfants + g.nbPersonnesAgees;
    return {
      type:               "GROUPE",
      entreprise:         g.entreprise,
      secteur:            g.secteur,
      contactNom:         g.contactNom,
      email:              g.contactEmail,
      telephone:          g.contactTel,
      debut:              g.dateDebut || now,
      dureeGarantie:      String(g.dureeAns),
      prime:              String(g.primeEstimee),
      tauxRemboursement:  g.tauxRemboursement,
      employes:           nbTotal,
      assures:            nbTotal,
      tarifsPersoAdulte:  g.tarifsPersoAdulte,
      tarifsPersoEnfant:  g.tarifsPersoEnfant,
      tarifsPersoAdulteAge: g.tarifsPersoAdulteAge,
      propositionRef:     prop.reference,
      statut:             "Actif",
    };
  }

  throw new Error("Proposition sans données famille ou groupe");
}
