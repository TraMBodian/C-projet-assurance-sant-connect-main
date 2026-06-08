import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Card }   from "@/components/ui/card";
import {
  Plus, Search, FileText, Building2, Users,
  Send, CheckCircle2, XCircle, ShieldCheck, Trash2,
  Loader2, X, Calculator, Pencil,
} from "@/components/ui/Icons";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

// ─── Résumé proposition ───────────────────────────────────────────────────────

function PropositionDetail({ prop }: { prop: Proposition }) {
  if (!prop.famille && !prop.groupe) return null;
  return (
    <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
      {prop.famille && (
        <>
          <p><strong>Souscripteur :</strong> {prop.famille.souscripteurNom}</p>
          <p>
            {[
              prop.famille.nbAdultes        > 0 && `${prop.famille.nbAdultes} adulte${prop.famille.nbAdultes > 1 ? "s" : ""}`,
              prop.famille.nbEnfants        > 0 && `${prop.famille.nbEnfants} enfant${prop.famille.nbEnfants > 1 ? "s" : ""}`,
              prop.famille.nbPersonnesAgees > 0 && `${prop.famille.nbPersonnesAgees} âgé${prop.famille.nbPersonnesAgees > 1 ? "s" : ""}`,
              prop.famille.typeGarantie,
              `${prop.famille.dureeAns} an${prop.famille.dureeAns > 1 ? "s" : ""}`,
            ].filter(Boolean).join(" · ")}
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
            {[
              prop.groupe.nbAdultes        > 0 && `${prop.groupe.nbAdultes} adulte${prop.groupe.nbAdultes > 1 ? "s" : ""}`,
              prop.groupe.nbEnfants        > 0 && `${prop.groupe.nbEnfants} enfant${prop.groupe.nbEnfants > 1 ? "s" : ""}`,
              prop.groupe.nbPersonnesAgees > 0 && `${prop.groupe.nbPersonnesAgees} âgé${prop.groupe.nbPersonnesAgees > 1 ? "s" : ""}`,
              `${prop.groupe.dureeAns} an${prop.groupe.dureeAns > 1 ? "s" : ""}`,
              prop.groupe.tarifsPersoAdulte != null && "Tarifs personnalisés",
            ].filter(Boolean).join(" · ")}
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
  prop:          Proposition;
  isHighlighted: boolean;
  onAction:      (id: string, statut: StatutProposition) => void;
  onDelete:      (id: string) => void;
  onConvert:     (id: string) => void;
}) {
  const s        = STATUT_STYLES[prop.statut];
  const isGroupe = prop.type === "GROUPE";
  const nom      = prop.famille?.souscripteurNom ?? prop.groupe?.entreprise ?? "—";

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

          {/* Brouillon : envoyer au client (optionnel) */}
          {prop.statut === "brouillon" && (
            <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => onAction(prop.id, "envoyee")} title="Marquer comme envoyée au client">
              <Send className="w-3.5 h-3.5" /> Envoyer
            </Button>
          )}

          {/* Brouillon ou Envoyée : l'admin peut Accepter ou Refuser */}
          {(prop.statut === "brouillon" || prop.statut === "envoyee") && (
            <>
              <Button size="sm" className="gap-1.5 text-white bg-green-600 hover:bg-green-700"
                onClick={() => onAction(prop.id, "acceptee")}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Accepter
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => onAction(prop.id, "refusee")}>
                <XCircle className="w-3.5 h-3.5" /> Refuser
              </Button>
            </>
          )}

          {/* Acceptée : convertir en police */}
          {prop.statut === "acceptee" && (
            <Button size="sm" className="gap-1.5 text-white" style={{ background: "#1B5299" }}
              onClick={() => onConvert(prop.id)}>
              <ShieldCheck className="w-3.5 h-3.5" /> Créer la police
            </Button>
          )}

          {/* Convertie : lien vers la police */}
          {prop.statut === "convertie" && (
            <span className="text-xs text-purple-700 font-medium flex items-center gap-1 bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5" />
              {prop.policeId ? `Police #${prop.policeId}` : "Police créée"}
            </span>
          )}

          {/* Supprimer (brouillon ou refusée) */}
          {(prop.statut === "brouillon" || prop.statut === "refusee") && (
            <button type="button" onClick={() => onDelete(prop.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Supprimer">
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
  { value: "all",       label: "Toutes"     },
  { value: "brouillon", label: "Brouillons" },
  { value: "envoyee",   label: "Envoyées"   },
  { value: "acceptee",  label: "Acceptées"  },
  { value: "refusee",   label: "Refusées"   },
  { value: "convertie", label: "Converties" },
];

export default function PropositionsPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const highlightId = (location.state as any)?.highlightId ?? null;

  const [propositions,  setPropositions]  = useState<Proposition[]>([]);
  const [filtre,        setFiltre]        = useState<StatutProposition | "all">("all");
  const [search,        setSearch]        = useState("");
  const [convertProp,   setConvertProp]   = useState<Proposition | null>(null);
  const [primeOverride, setPrimeOverride] = useState<string>("");
  const [converting,    setConverting]    = useState(false);
  const [deleteId,      setDeleteId]      = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await DataService.getPropositions();
        setPropositions(data);
      } catch {
        setPropositions([]);
      }
    })();
  }, []);

  const reload = async () => {
    try {
      const data = await DataService.getPropositions();
      setPropositions(data);
    } catch {
      setPropositions([]);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return propositions.filter(p => {
      if (filtre !== "all" && p.statut !== filtre) return false;
      if (!q) return true;
      const nom = p.famille?.souscripteurNom ?? p.groupe?.entreprise ?? "";
      return nom.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
    });
  }, [propositions, filtre, search]);

  const handleAction = async (id: string, statut: StatutProposition) => {
    await DataService.updatePropositionStatut(id, statut);
    await reload();
    const labels: Record<string, string> = {
      envoyee:  "Proposition envoyée",
      acceptee: "Proposition acceptée",
      refusee:  "Proposition refusée",
    };
    toast.success(labels[statut] ?? "Statut mis à jour");
  };

  const openConvertDialog = (id: string) => {
    // Cherche dans l'état local pour éviter un appel async sans await
    const prop = propositions.find(p => p.id === id) ?? null;
    if (!prop) return;
    const prime = prop.famille?.primeEstimee ?? prop.groupe?.primeEstimee ?? 0;
    setPrimeOverride(String(prime));
    setConvertProp(prop);
  };

  const handleConvert = async () => {
    if (!convertProp) return;
    setConverting(true);
    try {
      const primeFinale = Number(primeOverride) || (convertProp.famille?.primeEstimee ?? convertProp.groupe?.primeEstimee ?? 0);

      // 1. Créer la police (backend)
      const police   = await DataService.createPolice(buildPolicePayload(convertProp, primeFinale));
      const policeId = String(police?.id ?? Date.now());

      // 2. Créer la fiche famille ou groupe liée à la proposition
      if (convertProp.famille) {
        const f = convertProp.famille;
        await DataService.createFamille({
          principal:            f.souscripteurNom,
          telephone:            f.souscripteurTel,
          emailPrincipal:       f.souscripteurEmail,
          adresse:              f.souscripteurAdresse,
          typePrincipal:        "adulte",
          beneficiaires:        [],
          beneficiairesDetail:  [],
          dateDebut:            f.dateDebut,
          dureeGarantie:        String(f.dureeAns),
          prime:                String(primeFinale),
          statut:               "ACTIF",
          propositionRef:       convertProp.reference,
          policeId:             policeId,
          nbAdultes:            f.nbAdultes,
          nbEnfants:            f.nbEnfants,
          nbPersonnesAgees:     f.nbPersonnesAgees,
          typeGarantie:         f.typeGarantie,
          tauxRemboursement:    f.tauxRemboursement,
          tarifsPersoAdulte:    f.tarifsPersoAdulte,
          tarifsPersoEnfant:    f.tarifsPersoEnfant,
          tarifsPersoAdulteAge: f.tarifsPersoAdulteAge,
          observations:         f.observations,
        });
      } else if (convertProp.groupe) {
        const g = convertProp.groupe;
        await DataService.createGroupe({
          entreprise:           g.entreprise,
          secteur:              g.secteur,
          contactNom:           g.contactNom,
          contactEmail:         g.contactEmail,
          contactTel:           g.contactTel,
          debut:                g.dateDebut,
          dureeGarantie:        String(g.dureeAns),
          prime:                String(primeFinale),
          statut:               "ACTIF",
          propositionRef:       convertProp.reference,
          policeId:             policeId,
          employes:             g.nbAdultes + g.nbEnfants + g.nbPersonnesAgees,
          assures:              g.nbAdultes + g.nbEnfants + g.nbPersonnesAgees,
          nbAdultes:            g.nbAdultes,
          nbEnfants:            g.nbEnfants,
          nbPersonnesAgees:     g.nbPersonnesAgees,
          typeGarantie:         g.typeGarantie,
          tauxRemboursement:    g.tauxRemboursement,
          tarifsPersoAdulte:    g.tarifsPersoAdulte,
          tarifsPersoEnfant:    g.tarifsPersoEnfant,
          tarifsPersoAdulteAge: g.tarifsPersoAdulteAge,
          observations:         g.observations,
        });
      }

      // 3. Marquer la proposition comme convertie
      await DataService.updateProposition(convertProp.id, { statut: "convertie", policeId });
      await reload();
      toast.success(`Police créée — ${convertProp.reference} · ${primeFinale.toLocaleString("fr-FR")} FCFA`);
      setConvertProp(null);
      navigate(convertProp.famille ? "/admin/maladie-famille" : "/admin/maladie-groupe");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la création de la police");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await DataService.deleteProposition(deleteId);
    await reload();
    setDeleteId(null);
    toast.success("Proposition supprimée");
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: propositions.length };
    for (const p of propositions) c[p.statut] = (c[p.statut] ?? 0) + 1;
    return c;
  }, [propositions]);

  return (
    <>
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

          {/* ── Filtres ── */}
          <div className="flex flex-wrap gap-2">
            {FILTRES.map(f => (
              <button key={f.value} onClick={() => setFiltre(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  filtre === f.value
                    ? "bg-[#1B5299] text-white border-[#1B5299] shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1B5299] hover:text-[#1B5299]"
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
                  onConvert={openConvertDialog}
                />
              ))}
            </div>
          )}

        </div>
      </AppLayout>

      {/* ── Dialogue de conversion proposition → police ─────────────────────── */}
      <Dialog open={!!convertProp} onOpenChange={v => !v && setConvertProp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: "#1B5299" }} />
              Créer la police — {convertProp?.reference}
            </DialogTitle>
          </DialogHeader>

          {convertProp && (
            <div className="space-y-5 pt-1">

              {/* Récapitulatif */}
              <div className="rounded-xl border p-4 space-y-2 bg-gray-50 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  {convertProp.type === "FAMILLE"
                    ? <Users     className="w-4 h-4 text-blue-600"   />
                    : <Building2 className="w-4 h-4 text-purple-600" />
                  }
                  <span className="font-semibold">
                    {convertProp.famille?.souscripteurNom ?? convertProp.groupe?.entreprise}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground px-2 py-0.5 rounded-full border">
                    {convertProp.type === "FAMILLE" ? "Famille" : "Groupe"}
                  </span>
                </div>
                {convertProp.famille && (
                  <p className="text-muted-foreground text-xs">
                    {[
                      convertProp.famille.nbAdultes > 0        && `${convertProp.famille.nbAdultes} adulte${convertProp.famille.nbAdultes > 1 ? "s" : ""}`,
                      convertProp.famille.nbEnfants > 0        && `${convertProp.famille.nbEnfants} enfant${convertProp.famille.nbEnfants > 1 ? "s" : ""}`,
                      convertProp.famille.nbPersonnesAgees > 0 && `${convertProp.famille.nbPersonnesAgees} âgé${convertProp.famille.nbPersonnesAgees > 1 ? "s" : ""}`,
                      convertProp.famille.typeGarantie,
                      `${convertProp.famille.dureeAns} an${convertProp.famille.dureeAns > 1 ? "s" : ""}`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                )}
                {convertProp.groupe && (
                  <p className="text-muted-foreground text-xs">
                    {[
                      convertProp.groupe.secteur,
                      `${convertProp.groupe.nbAdultes + convertProp.groupe.nbEnfants + convertProp.groupe.nbPersonnesAgees} assuré(s)`,
                      `${convertProp.groupe.dureeAns} an${convertProp.groupe.dureeAns > 1 ? "s" : ""}`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              {/* Prime ajustable */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-semibold">
                  <Calculator className="w-4 h-4" style={{ color: "#1B5299" }} />
                  Prime appliquée à la police
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(modifiable)</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={primeOverride}
                    onChange={e => setPrimeOverride(e.target.value)}
                    className="font-mono text-right text-base font-bold"
                    style={{ color: "#1B5299" }}
                  />
                  <span className="text-sm text-muted-foreground shrink-0">FCFA</span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Pencil className="w-3 h-3" />
                  Issue du calcul tarifaire — ajustable avant validation définitive.
                </p>
              </div>

              {/* Note jonction */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Cette action va créer :</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  <li>Une <strong>police d'assurance</strong> enregistrée dans le système</li>
                  <li>
                    Une fiche{" "}
                    <strong>
                      {convertProp.type === "FAMILLE" ? "Maladie Famille" : "Maladie Groupe"}
                    </strong>{" "}
                    liée à cette proposition ({convertProp.reference})
                  </li>
                </ul>
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setConvertProp(null)}>
                  Annuler
                </Button>
                <Button
                  className="flex-[2] gap-2 text-white"
                  style={{ background: "#1B5299" }}
                  disabled={converting || !primeOverride || Number(primeOverride) <= 0}
                  onClick={handleConvert}
                >
                  {converting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours…</>
                    : <><ShieldCheck className="w-4 h-4" /> Créer la police</>
                  }
                </Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Helpers : construction payload police ─────────────────────────────────────

function buildPolicePayload(prop: Proposition, primeFinale: number): any {
  const now = new Date().toISOString().slice(0, 10);
  const nbTotal = prop.famille
    ? prop.famille.nbAdultes + prop.famille.nbEnfants + prop.famille.nbPersonnesAgees
    : prop.groupe
      ? prop.groupe.nbAdultes + prop.groupe.nbEnfants + prop.groupe.nbPersonnesAgees
      : 0;

  const nom = prop.famille?.souscripteurNom ?? prop.groupe?.entreprise ?? "Inconnu";
  const type = prop.type === "FAMILLE" ? "FAMILLE" : "GROUPE";

  return {
    numero:       "POL-" + Date.now(),
    type,
    montantPrime: primeFinale,
    couverture:   `${prop.famille?.typeGarantie ?? prop.groupe?.typeGarantie ?? "Standard"} — ${nbTotal} assuré(s) — ${nom}`,
    statut:       "ACTIVE",
  };
}
