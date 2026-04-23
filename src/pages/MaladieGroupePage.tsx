import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Building2, Users, TrendingUp, Pencil, Trash2,
  Calendar, RefreshCw, ShieldCheck, ChevronDown, ChevronUp, ArrowRightLeft, FileText,
} from "@/components/ui/Icons";
import { MouvementModal } from "@/components/MouvementModal";
import { motion } from "framer-motion";
import {
  getGarantiesCNART, REAJUSTEMENT_SP,
  typeFromDate, TYPE_COLORS,
} from "./NewFamillePage";
import { CHAPITRES } from "./ConditionsGeneralesPage";
import { getTarifs } from "@/services/tarifService";
import { calcDecomptePopulation, type MembrePopulation } from "./NewGroupePage";

// Parse employesDetail : le backend retourne une chaîne JSON, pas un tableau
function parseDetail(raw: any): any[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
    catch { return []; }
  }
  return [];
}

// Convertit le JSON stocké en liste de MembrePopulation
function toMembres(groupe: any): MembrePopulation[] {
  const detail = parseDetail(groupe.employesDetail);
  if (detail.length === 0) return [];

  // Nouveau format : chaque item est directement un MembrePopulation
  if (detail[0] && "dateNaissance" in detail[0] && !("famille" in detail[0])) {
    return detail.map((m: any, i: number) => ({
      numero:        m.numero || i + 1,
      nom:           m.nom || "",
      dateNaissance: m.dateNaissance || "",
      sexe:          m.sexe || "",
      pieceIdentite: m.pieceIdentite || "",
      lien:          m.lien || "",
      dateAdhesion:  m.dateAdhesion || "",
      salaire:       m.salaire,
      garantie:      m.garantie || "Standard",
      type:          m.type || typeFromDate(m.dateNaissance || ""),
    }));
  }

  // Ancien format (employé + famille) — rétro-compatibilité
  const result: MembrePopulation[] = [];
  let n = 1;
  for (const emp of detail) {
    result.push({
      numero: n++, nom: emp.nom || "", dateNaissance: emp.dateNaissance || "",
      sexe: "", pieceIdentite: emp.matricule || "", lien: "Employé",
      dateAdhesion: "", salaire: undefined, garantie: "Standard",
      type: emp.type || typeFromDate(emp.dateNaissance || ""),
    });
    for (const m of (emp.famille || [])) {
      result.push({
        numero: n++, nom: m.nom || "", dateNaissance: m.dateNaissance || "",
        sexe: "", pieceIdentite: "", lien: m.lien || "Famille",
        dateAdhesion: "", salaire: undefined, garantie: "Standard",
        type: m.type || typeFromDate(m.dateNaissance || ""),
      });
    }
  }
  return result;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────

function echeanceGroupe(groupe: any): string {
  if (!groupe.debut || !groupe.dureeGarantie) return groupe.fin || "—";
  const d = new Date(groupe.debut);
  d.setFullYear(d.getFullYear() + Number(groupe.dureeGarantie));
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("fr-FR");
}

function isExpiringSoon(groupe: any): boolean {
  if (!groupe.debut || !groupe.dureeGarantie) return false;
  const d = new Date(groupe.debut);
  d.setFullYear(d.getFullYear() + Number(groupe.dureeGarantie));
  d.setDate(d.getDate() - 1);
  return d.getTime() - Date.now() < 30 * 24 * 3600 * 1000 && d.getTime() > Date.now();
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function MaladieGroupePage() {
  const navigate = useNavigate();
  const [groupes, setGroupes]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [search, setSearch]             = useState("");
  const [showGaranties, setShowGaranties] = useState(false);
  const [showReajust, setShowReajust]     = useState(false);
  const [showCG,      setShowCG]          = useState(false);
  const [openChap,    setOpenChap]        = useState<string | null>(null);
  const [expandedGroupe, setExpandedGroupe]     = useState<number | null>(null);
  const [mouvementGroupe, setMouvementGroupe]   = useState<any | null>(null);
  const tarifs = getTarifs();

  useEffect(() => {
    DataService.getGroupes()
      .then(data => setGroupes(data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const onDelete = async (id: number) => {
    await DataService.deleteGroupe(id);
    setGroupes(prev => prev.filter(g => g.id !== id));
  };

  const filtered = groupes.filter(g =>
    g.entreprise.toLowerCase().includes(search.toLowerCase())
  );

  // Stats globales
  const totalAssures = groupes.reduce((s, g) => s + toMembres(g).length, 0);
  const totalPrime   = groupes.reduce((s, g) => {
    const d = calcDecomptePopulation(toMembres(g));
    return s + d.total * Number(g.dureeGarantie || 1);
  }, 0);

  if (loading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-muted-foreground">Chargement...</span>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <Building2 className="w-10 h-10 text-muted-foreground opacity-30" />
        <p className="font-semibold text-lg">Impossible de joindre le serveur</p>
        <p className="text-sm text-muted-foreground">Service temporairement indisponible</p>
      </div>
    </AppLayout>
  );

  return (
    <>
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">

        {/* ── En-tête ── */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold">Maladie Groupe</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Polices entreprises — Papy Services Assurances · Taux 80 %</p>
          </div>
          <Button
            className="shrink-0 text-sm"
            onClick={() => navigate("/maladie-groupe/new")}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Nouveau Groupe</span>
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { icon: <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, bg: "from-blue-500 to-blue-600",    label: "Entreprises", value: groupes.length },
            { icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, bg: "from-green-500 to-green-600", label: "Actifs",      value: groupes.filter(g => g.statut === "Actif").length },
            { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,      bg: "from-purple-500 to-purple-600", label: "Assurés",   value: totalAssures },
            { icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, bg: "from-indigo-500 to-indigo-600", label: "Primes",   value: totalPrime >= 1_000_000 ? `${(totalPrime/1_000_000).toFixed(1)}M F` : totalPrime >= 1000 ? `${(totalPrime/1000).toFixed(0)}k F` : `${totalPrime} F` },
          ].map((s, i) => (
            <Card key={i} className="p-2.5 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-2 sm:p-3 bg-gradient-to-br ${s.bg} rounded-lg shrink-0`}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{s.label}</p>
                  <p className="text-base sm:text-xl font-bold truncate">{s.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Tableau des garanties CNART ── */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setShowGaranties(!showGaranties)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold text-sm">Tableau des garanties — Prise en charge au Sénégal</p>
                <p className="text-xs text-muted-foreground">Tous les actes couverts à 80 % · Cliquer pour afficher</p>
              </div>
            </div>
            {showGaranties ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showGaranties && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-blue-700 text-white">
                    <th className="text-left p-3 font-semibold">Nature des actes accordés à tous les bénéficiaires</th>
                    <th className="p-3 text-center font-semibold w-28">Taux de remboursement</th>
                    <th className="text-left p-3 font-semibold">Plafond de remboursement</th>
                  </tr>
                </thead>
                <tbody>
                  {getGarantiesCNART(tarifs).map((row, i) => (
                    <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="p-3">
                        <p className="font-semibold text-xs text-blue-700 uppercase">{row.categorie}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{row.actes}</p>
                      </td>
                      <td className="p-3 text-center font-bold text-green-700">{row.taux}</td>
                      <td className="p-3 text-xs text-muted-foreground">{row.plafond}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </Card>

        {/* ── Réajustement S/P ── */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setShowReajust(!showReajust)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <div className="text-left">
                <p className="font-semibold text-sm">Réajustement de la prime — Rapport S/P</p>
                <p className="text-xs text-muted-foreground">Avenant établi dans les 3 mois suivant l'échéance</p>
              </div>
            </div>
            {showReajust ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showReajust && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 font-semibold">Rapport S/P</th>
                    <th className="text-left p-3 font-semibold">Pourcentage d'ajustement</th>
                  </tr>
                </thead>
                <tbody>
                  {REAJUSTEMENT_SP.map((row, i) => (
                    <tr key={i} className={`border-t ${
                      row.ajustement.includes("réduction") ? "bg-green-50"
                      : row.ajustement === "Aucune modification" ? "bg-gray-50"
                      : "bg-red-50"
                    }`}>
                      <td className="p-3 font-mono text-xs">{row.rapport}</td>
                      <td className={`p-3 text-xs font-semibold ${
                        row.ajustement.includes("réduction") ? "text-green-700"
                        : row.ajustement === "Aucune modification" ? "text-gray-600"
                        : "text-red-700"
                      }`}>{row.ajustement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </Card>

        {/* ── Conditions Générales ── */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCG(!showCG)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="font-semibold text-sm">Conditions Générales</p>
                <p className="text-xs text-muted-foreground">{CHAPITRES.length} chapitres — Garanties, délais, exclusions, résiliation…</p>
              </div>
            </div>
            {showCG ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showCG && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t divide-y divide-border">
              {CHAPITRES.map((chap) => (
                <div key={chap.numero}>
                  <button
                    type="button"
                    onClick={() => setOpenChap(openChap === chap.numero ? null : chap.numero)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="font-semibold text-sm text-blue-700">
                      Chapitre {chap.numero} — {chap.titre}
                    </span>
                    {openChap === chap.numero
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    }
                  </button>
                  {openChap === chap.numero && (
                    <div className="px-4 pb-4 space-y-4 bg-gray-50/50">
                      {chap.articles.map((art, ai) => (
                        <div key={ai}>
                          <p className="font-semibold text-xs text-gray-700 uppercase tracking-wide mb-2">{art.titre}</p>
                          <div className="text-sm text-gray-600">{art.contenu}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </Card>

        {/* ── Recherche ── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher une entreprise..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* ── Liste des groupes ── */}
        <div className="grid gap-6">
          {filtered.map((groupe, gi) => {
            const membres  = toMembres(groupe);
            const decompte     = calcDecomptePopulation(membres);
            const duree        = Number(groupe.dureeGarantie || 1);
            const cpDisplay    = Number(groupe.cp) || decompte.cp;
            const taxesDisplay = Math.round((decompte.primeNette + cpDisplay) * decompte.tauxTaxe / 100);
            const echeance = echeanceGroupe(groupe);
            const soon     = isExpiringSoon(groupe);
            const isOpen   = expandedGroupe === groupe.id;

            return (
              <motion.div
                key={groupe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.05 }}
              >
                <Card className={`overflow-hidden ${soon ? "border-orange-300" : ""}`}>
                  {soon && (
                    <div className="px-4 py-2 bg-orange-50 border-b border-orange-200 text-xs text-orange-700 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Échéance dans moins de 30 jours
                    </div>
                  )}

                  {/* ── En-tête groupe ── */}
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-3 sm:gap-4 items-start">
                      <div className="shrink-0">
                        {groupe.logo ? (
                          <img
                            src={groupe.logo}
                            alt={groupe.entreprise}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-contain border border-gray-200 bg-white p-1"
                          />
                        ) : (
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <h3 className="text-sm sm:text-xl font-semibold truncate">{groupe.entreprise}</h3>
                          <Badge variant={groupe.statut === "Actif" ? "default" : "secondary"}>{groupe.statut}</Badge>
                          {groupe.echeanceAuto && (
                            <span className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              <RefreshCw className="w-3 h-3" /> Auto
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 truncate">{groupe.secteur}</p>

                        {/* Résumé population */}
                        <div className="flex flex-wrap gap-3 mb-3">
                          <div className="flex items-center gap-1.5 text-xs bg-gray-50 border px-2 py-1 rounded">
                            <Users className="w-3 h-3" />
                            {membres.length} assuré{membres.length > 1 ? "s" : ""}
                          </div>
                          {decompte.nb.enfant > 0 && (
                            <div className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded">
                              {decompte.nb.enfant} enfant{decompte.nb.enfant > 1 ? "s" : ""}
                            </div>
                          )}
                          {decompte.nb.adulte > 0 && (
                            <div className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded">
                              {decompte.nb.adulte} adulte{decompte.nb.adulte > 1 ? "s" : ""}
                            </div>
                          )}
                          {decompte.nb.adulte_age > 0 && (
                            <div className="flex items-center gap-1.5 text-xs bg-purple-50 border border-purple-200 text-purple-700 px-2 py-1 rounded">
                              {decompte.nb.adulte_age} âgé{decompte.nb.adulte_age > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>

                        {/* Infos clés */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Date début</p>
                            <p className="font-semibold text-sm">
                              {groupe.debut ? new Date(groupe.debut).toLocaleDateString("fr-FR") : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Durée</p>
                            <p className="font-semibold text-sm">{duree} an{duree > 1 ? "s" : ""}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Échéance
                            </p>
                            <p className={`font-semibold text-sm ${soon ? "text-orange-600" : ""}`}>{echeance}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total à payer</p>
                            <p className="font-bold text-sm text-blue-700">
                              {(Number(groupe.prime) > 0 ? Number(groupe.prime) * duree : decompte.total * duree).toLocaleString("fr-FR")} FCFA
                            </p>
                          </div>
                        </div>

                        {/* Actions principales toujours visibles */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Button
                            onClick={() => setMouvementGroupe(groupe)}
                            variant="outline" size="sm" className="text-xs h-8 border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                            <span>Mouvement</span>
                          </Button>
                          <Button
                            onClick={() => navigate(`/maladie-groupe/new?id=${groupe.id}`)}
                            variant="outline" size="sm" className="text-xs h-8"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            <span>Modifier</span>
                          </Button>
                          <Button
                            onClick={() => onDelete(groupe.id)}
                            variant="destructive" size="sm" className="text-xs h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Supprimer</span>
                          </Button>
                        </div>

                        {/* Toggle décompte */}
                        <button
                          type="button"
                          onClick={() => setExpandedGroupe(isOpen ? null : groupe.id)}
                          className="text-xs text-blue-600 flex items-center gap-1 mb-3 hover:underline"
                        >
                          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isOpen ? "Masquer" : "Voir"} le décompte & les employés
                        </button>

                        {/* Section dépliée */}
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4 mb-4"
                          >
                            {/* Décompte */}
                            <div className="rounded-lg border overflow-hidden text-sm">
                              {[
                                { label: `Enfants (${decompte.nb.enfant})`,       val: decompte.primeEnfants * duree,    show: decompte.nb.enfant > 0 },
                                { label: `Adultes (${decompte.nb.adulte})`,        val: decompte.primeAdultes * duree,    show: decompte.nb.adulte > 0 },
                                { label: `Personnes âgées (${decompte.nb.adulte_age})`, val: decompte.primeAdultesAge * duree, show: decompte.nb.adulte_age > 0 },
                                { label: "Prime Nette (Population)",       val: decompte.primeNette * duree,  show: true, bold: true },
                                { label: "Coût de police", val: cpDisplay * duree, show: true },
                                { label: "Taxes (10 %)", val: taxesDisplay * duree, show: true },
                              ].filter(r => r.show).map((row, idx) => (
                                <div key={idx} className={`flex justify-between px-4 py-2.5 border-t ${(row as any).bold ? "bg-blue-50 font-semibold" : ""}`}>
                                  <span>{row.label}</span>
                                  <span className={`font-mono ${(row as any).bold ? "text-blue-700" : ""}`}>
                                    {row.val.toLocaleString("fr-FR")} FCFA
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between px-4 py-3 border-t bg-blue-600 text-white font-bold">
                                <span>TOTAL À PAYER</span>
                                <span className="font-mono">{(Number(groupe.prime) > 0 ? Number(groupe.prime) * duree : decompte.total * duree).toLocaleString("fr-FR")} FCFA</span>
                              </div>
                            </div>

                            {/* Liste des membres */}
                            <div>
                              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-600" />
                                Liste des assurés ({membres.length})
                              </p>
                              <div className="rounded-lg border overflow-hidden">
                                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                                  <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-gray-50 border-b">
                                      <tr>
                                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">N°</th>
                                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Nom et Prénom</th>
                                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Lien</th>
                                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Catégorie</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {membres.map((m, mi) => (
                                        <tr key={mi} className={`border-t ${mi % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                                          <td className="px-3 py-2 text-muted-foreground">{m.numero}</td>
                                          <td className="px-3 py-2 font-medium">{m.nom}</td>
                                          <td className="px-3 py-2 text-muted-foreground">{m.lien || "—"}</td>
                                          <td className="px-3 py-2">
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLORS[m.type]}`}>
                                              {m.type === "enfant" ? "Enfant" : m.type === "adulte" ? "Adulte" : "Âgé"}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}

                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun groupe trouvé</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>

    {mouvementGroupe && (
      <MouvementModal
        contrat={mouvementGroupe}
        contratType="groupe"
        onClose={() => setMouvementGroupe(null)}
        onSaved={() => {
          DataService.getGroupes().then(data => setGroupes(data ?? []));
          setMouvementGroupe(null);
        }}
      />
    )}
    </>
  );
}
