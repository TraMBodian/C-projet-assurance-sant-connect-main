import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Users, UserCheck, TrendingUp, Pencil, Trash2,
  Calendar, RefreshCw, ShieldCheck, ChevronDown, ChevronUp, ArrowRightLeft, FileText,
} from "@/components/ui/Icons";
import { MouvementModal } from "@/components/MouvementModal";
import { PhotoAvatar } from "@/components/PhotoUpload";
import { motion } from "framer-motion";
import {
  getGarantiesCNART, REAJUSTEMENT_SP, calcDecompte,
  type TypeAssure, type Beneficiaire,
} from "./NewFamillePage";
import { CHAPITRES } from "../ConditionsGeneralesPage";
import { getTarifs } from "@/services/tarifService";


// ─── Helpers ──────────────────────────────────────────────────────────────────

function echeanceFamille(famille: any): string {
  if (!famille.dateDebut || !famille.dureeGarantie) return famille.dateFin || "—";
  const d = new Date(famille.dateDebut);
  d.setFullYear(d.getFullYear() + Number(famille.dureeGarantie));
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("fr-FR");
}

function isExpiringSoon(famille: any): boolean {
  if (!famille.dateDebut || !famille.dureeGarantie) return false;
  const d = new Date(famille.dateDebut);
  d.setFullYear(d.getFullYear() + Number(famille.dureeGarantie));
  d.setDate(d.getDate() - 1);
  return d.getTime() - Date.now() < 30 * 24 * 3600 * 1000 && d.getTime() > Date.now();
}

function getBeneficiairesDetail(famille: any): Beneficiaire[] {
  if (famille.beneficiairesDetail) return famille.beneficiairesDetail;
  return (famille.beneficiaires || []).map((b: string) => ({
    nom:  b.replace(/ \(.+\)$/, ""),
    lien: (b.match(/\((.+)\)$/) || [])[1] || "",
    type: "adulte" as TypeAssure,
  }));
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function MaladieFamillePage() {
  const navigate = useNavigate();
  const [familles, setFamilles]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [search, setSearch]         = useState("");
  const [showGaranties, setShowGaranties] = useState(false);
  const [showReajust,    setShowReajust]    = useState(false);
  const [showCG,         setShowCG]         = useState(false);
  const [openChap,       setOpenChap]       = useState<string | null>(null);
  const [showConditions, setShowConditions] = useState(false);
  const [expanded, setExpanded]           = useState<number | null>(null);
  const [mouvementFamille, setMouvementFamille] = useState<any | null>(null);
  const tarifs = getTarifs();

  useEffect(() => {
    DataService.getFamilles()
      .then(data => setFamilles(data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const onDelete = async (id: number) => {
    await DataService.deleteFamille(id);
    setFamilles(prev => prev.filter(f => f.id !== id));
  };

  const filtered = familles.filter(f =>
    f.principal.toLowerCase().includes(search.toLowerCase())
  );

  // Stats globales
  const totalPersonnes = familles.reduce((s, f) => {
    const benef = getBeneficiairesDetail(f);
    return s + benef.length + 1;
  }, 0);
  const totalPrime = familles.reduce((s, f) => {
    const benef = getBeneficiairesDetail(f);
    const d = calcDecompte(benef, f.typePrincipal || "adulte");
    return s + d.total * Number(f.dureeGarantie || 1);
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
        <Users className="w-10 h-10 text-muted-foreground opacity-30" />
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
            <h1 className="text-xl sm:text-3xl font-bold">Maladie Famille</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Polices familiales — Papy Services Assurances · Taux 80 %</p>
          </div>
          <Button
            className="shrink-0 text-sm"
            onClick={() => navigate("/admin/maladie-famille/new")}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Nouvelle Famille</span>
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,    bg: "from-blue-500 to-blue-600",    label: "Familles",       value: familles.length },
            { icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, bg: "from-green-500 to-green-600", label: "Actifs",         value: familles.filter(f => f.statut === "Actif").length },
            { icon: <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, bg: "from-purple-500 to-purple-600", label: "Assurés",      value: totalPersonnes },
            { icon: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />, bg: "from-indigo-500 to-indigo-600", label: "Primes",     value: totalPrime >= 1_000_000 ? `${(totalPrime/1_000_000).toFixed(1)}M F` : totalPrime >= 1000 ? `${(totalPrime/1000).toFixed(0)}k F` : `${totalPrime} F` },
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

        {/* ── Tableau des garanties CNART (collapsible) ── */}
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
            {showGaranties ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
          </button>

          {showGaranties && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t overflow-x-auto"
            >
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
                      <td className="p-3 text-center font-bold text-green-700 text-sm">{row.taux}</td>
                      <td className="p-3 text-xs text-muted-foreground">{row.plafond}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </Card>

        {/* ── Conditions de souscription (collapsible) ── */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setShowConditions(!showConditions)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="text-left">
              <p className="font-semibold text-sm">Conditions de souscription</p>
              <p className="text-xs text-muted-foreground">Conditions d'adhésion, documents requis, délais de carence et exclusions</p>
            </div>
            {showConditions ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
          </button>
          {showConditions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t"
            >
              <div className="p-5 space-y-5 text-sm">
                <div>
                  <p className="font-bold text-blue-700 uppercase text-xs tracking-wider mb-2">I. Conditions d'adhésion</p>
                  <ul className="space-y-1 text-gray-700">
                    <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Souscripteur âgé de 18 à 65 ans révolus à la date d'effet du contrat.</li>
                    <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Bénéficiaires : conjoint(e), enfants à charge (0–21 ans ; 25 ans si études) ; ascendants à charge de moins de 65 ans.</li>
                    <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Résidence habituelle au Sénégal ou dans la zone de territorialité du contrat.</li>
                    <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Déclaration sincère et complète de l'état de santé de chaque bénéficiaire.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-blue-700 uppercase text-xs tracking-wider mb-2">II. Documents requis</p>
                  <ul className="space-y-1 text-gray-700">
                    <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Formulaire de souscription dûment complété et signé.</li>
                    <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Pièce d'identité valide du souscripteur (CNI, passeport ou titre de séjour).</li>
                    <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Acte de mariage (pour le conjoint) et actes de naissance des enfants.</li>
                    <li className="flex gap-2"><span className="text-blue-400 shrink-0">•</span>Questionnaire médical pour les personnes de 50 ans et plus.</li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-amber-700 uppercase text-xs tracking-wider mb-2">III. Délais de carence</p>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-amber-50 border-b"><th className="text-left p-2.5 font-semibold">Type de prestation</th><th className="p-2.5 font-semibold text-right">Délai</th></tr></thead>
                      <tbody>
                        {[
                          { type: "Soins courants (hors accidents)", delai: "1 mois" },
                          { type: "Soins dentaires",                 delai: "3 mois" },
                          { type: "Optique",                         delai: "6 mois" },
                          { type: "Maternité",                       delai: "9 mois" },
                          { type: "Accidents corporels",             delai: "Aucun"  },
                        ].map((r, i) => (
                          <tr key={i} className={`border-t ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                            <td className="p-2.5">{r.type}</td>
                            <td className={`p-2.5 text-right font-semibold ${r.delai === "Aucun" ? "text-green-600" : "text-amber-700"}`}>{r.delai}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-red-700 uppercase text-xs tracking-wider mb-2">IV. Principales exclusions</p>
                  <ul className="space-y-1 text-gray-700">
                    <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Affections et maladies préexistantes à la date d'adhésion.</li>
                    <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Chirurgie esthétique non consécutive à un accident.</li>
                    <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Traitements expérimentaux non reconnus par les autorités sanitaires.</li>
                    <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Hospitalisations résultant de conflits armés ou catastrophes naturelles.</li>
                    <li className="flex gap-2"><span className="text-red-400 shrink-0">✕</span>Soins à l'étranger hors options Afrique ou Reste du Monde souscrites.</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </Card>

        {/* ── Réajustement S/P (collapsible) ── */}
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
            {showReajust ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
          </button>

          {showReajust && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t overflow-x-auto"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 font-semibold">Rapport S/P</th>
                    <th className="text-left p-3 font-semibold">Pourcentage d'ajustement</th>
                  </tr>
                </thead>
                <tbody>
                  {REAJUSTEMENT_SP.map((row, i) => (
                    <tr key={i} className={`border-t text-sm ${
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
            {showCG ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
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
            placeholder="Rechercher un assuré principal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* ── Liste familles ── */}
        <div className="grid gap-4">
          {filtered.map((famille, i) => {
            const benef    = getBeneficiairesDetail(famille);
            const decompte    = calcDecompte(benef, famille.typePrincipal || "adulte");
            const duree       = Number(famille.dureeGarantie || 1);
            const cpDisplay   = Number(famille.cp) || decompte.cp;
            const taxesDisplay = Math.round((decompte.primeNette + cpDisplay) * decompte.tauxTaxe / 100);
            const echeance = echeanceFamille(famille);
            const soon     = isExpiringSoon(famille);
            const isOpen   = expanded === famille.id;

            return (
              <motion.div
                key={famille.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`overflow-hidden ${soon ? "border-orange-300" : ""}`}>
                  {/* Alerte échéance */}
                  {soon && (
                    <div className="px-4 py-2 bg-orange-50 border-b border-orange-200 text-xs text-orange-700 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Échéance dans moins de 30 jours
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    <div className="flex gap-3 sm:gap-4">
                      {/* Avatar / Photo */}
                      <div className="shrink-0">
                        <PhotoAvatar
                          photo={famille.photo}
                          nom={famille.principal}
                          size="lg"
                          rounded="full"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Nom + badges */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <h3 className="text-sm sm:text-lg font-semibold truncate">{famille.principal}</h3>
                          <Badge variant={famille.statut === "Actif" ? "default" : "secondary"}>
                            {famille.statut}
                          </Badge>
                          <Badge variant="outline">{benef.length + 1} personnes</Badge>
                          {famille.echeanceAuto && (
                            <span className="text-xs flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              <RefreshCw className="w-3 h-3" /> Auto
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">{famille.telephone}</p>

                        {/* Population */}
                        <div className="flex flex-wrap gap-3 mb-3">
                          {decompte.nb.enfant > 0 && (
                            <div className="flex items-center gap-1.5 text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded">
                              <Users className="w-3 h-3" />
                              {decompte.nb.enfant} enfant{decompte.nb.enfant > 1 ? "s" : ""}
                            </div>
                          )}
                          {decompte.nb.adulte > 0 && (
                            <div className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-1 rounded">
                              <Users className="w-3 h-3" />
                              {decompte.nb.adulte} adulte{decompte.nb.adulte > 1 ? "s" : ""}
                            </div>
                          )}
                          {decompte.nb.adulte_age > 0 && (
                            <div className="flex items-center gap-1.5 text-xs bg-purple-50 border border-purple-200 text-purple-700 px-2 py-1 rounded">
                              <Users className="w-3 h-3" />
                              {decompte.nb.adulte_age} âgé{decompte.nb.adulte_age > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>

                        {/* Bénéficiaires */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {benef.map((b, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {b.nom} ({b.lien})
                              {b.type === "adulte_age" && (
                                <span className="ml-1 text-purple-600 font-medium">âgé</span>
                              )}
                            </span>
                          ))}
                        </div>

                        {/* Infos clés */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Date début</p>
                            <p className="font-semibold text-sm">
                              {famille.dateDebut ? new Date(famille.dateDebut).toLocaleDateString("fr-FR") : "—"}
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
                              {(Number(famille.prime) > 0 ? Number(famille.prime) * duree : decompte.total * duree).toLocaleString("fr-FR")} FCFA
                            </p>
                          </div>
                        </div>

                        {/* Actions principales toujours visibles */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Button
                            onClick={() => setMouvementFamille(famille)}
                            variant="outline" size="sm" className="text-xs h-8 border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                            <span>Mouvement</span>
                          </Button>
                          <Button
                            onClick={() => navigate(`/maladie-famille/new?id=${famille.id}`)}
                            variant="outline" size="sm" className="text-xs h-8"
                          >
                            <Pencil className="w-3.5 h-3.5 mr-1" />
                            <span>Modifier</span>
                          </Button>
                          <Button
                            onClick={() => onDelete(famille.id)}
                            variant="destructive" size="sm" className="text-xs h-8"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            <span>Supprimer</span>
                          </Button>
                        </div>

                        {/* Toggle décompte détaillé */}
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : famille.id)}
                          className="text-xs text-blue-600 flex items-center gap-1 mb-3 hover:underline"
                        >
                          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isOpen ? "Masquer" : "Voir"} le décompte de la prime
                        </button>

                        {/* Décompte détaillé */}
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="rounded-lg border overflow-hidden mb-4 text-sm"
                          >
                            {[
                              { label: `Enfants (${decompte.nb.enfant})`,     val: decompte.primeEnfants    * duree, show: decompte.nb.enfant > 0 },
                              { label: `Adultes (${decompte.nb.adulte})`,     val: decompte.primeAdultes    * duree, show: decompte.nb.adulte > 0 },
                              { label: `Personnes âgées (${decompte.nb.adulte_age})`, val: decompte.primeAdultesAge * duree, show: decompte.nb.adulte_age > 0 },
                              { label: "Prime Nette (Population)",          val: decompte.primeNette      * duree, show: true, bold: true },
                              { label: "Coût de police", val: cpDisplay * duree, show: true },
                              { label: "Taxes (10 %)", val: taxesDisplay * duree, show: true },
                            ].filter(r => r.show).map((row, idx) => (
                              <div key={idx} className={`flex justify-between px-4 py-2.5 border-t ${row.bold ? "bg-blue-50 font-semibold" : ""}`}>
                                <span>{row.label}</span>
                                <span className={`font-mono ${row.bold ? "text-blue-700" : ""}`}>
                                  {row.val.toLocaleString("fr-FR")} FCFA
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between px-4 py-3 border-t bg-blue-600 text-white font-bold">
                              <span>TOTAL À PAYER</span>
                              <span className="font-mono">{(Number(famille.prime) > 0 ? Number(famille.prime) * duree : decompte.total * duree).toLocaleString("fr-FR")} FCFA</span>
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
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune famille trouvée</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>

    {/* Modal mouvements famille */}
    {mouvementFamille && (
      <MouvementModal
        contrat={mouvementFamille}
        contratType="famille"
        onClose={() => setMouvementFamille(null)}
        onSaved={() => {
          DataService.getFamilles().then(data => setFamilles(data ?? []));
          setMouvementFamille(null);
        }}
      />
    )}
    </>
  );
}
