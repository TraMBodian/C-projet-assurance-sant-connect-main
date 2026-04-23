import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Eye, Loader2, Users, UserCheck, ChevronDown, ChevronUp, X } from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { Assure } from "@/types/insurance";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statutStyle: Record<string, string> = {
  ACTIF:    "bg-green-100 text-green-700 border-green-200",
  SUSPENDU: "bg-amber-100 text-amber-700 border-amber-200",
  RESILIE:  "bg-red-100 text-red-700 border-red-200",
  Actif:    "bg-green-100 text-green-700 border-green-200",
  Suspendu: "bg-amber-100 text-amber-700 border-amber-200",
  Résilié:  "bg-red-100 text-red-700 border-red-200",
};

const typeStyle: Record<string, string> = {
  FAMILLE: "bg-blue-100 text-blue-700",
  GROUPE:  "bg-purple-100 text-purple-700",
  famille: "bg-blue-100 text-blue-700",
  groupe:  "bg-purple-100 text-purple-700",
};

const typeLabel: Record<string, string> = {
  FAMILLE: "Famille", GROUPE: "Groupe",
  famille: "Famille", groupe:  "Groupe",
};

const lienStyle: Record<string, string> = {
  Principal: "bg-blue-100 text-blue-800 border-blue-200 font-semibold",
  Conjoint:  "bg-pink-100 text-pink-700 border-pink-200",
  Enfant:    "bg-green-100 text-green-700 border-green-200",
};

function fmtDate(d?: string) {
  if (!d) return "—";
  // déjà JJ/MM/AAAA ?
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("fr-FR");
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AssuresPage() {
  const navigate = useNavigate();

  const [search,   setSearch]   = useState("");
  const [assures,  setAssures]  = useState<Assure[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [typeFilter, setTypeFilter]   = useState<"all" | "FAMILLE" | "GROUPE">("all");
  const [statutFilter, setStatutFilter] = useState<"all" | "ACTIF" | "SUSPENDU" | "RESILIE">("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await DataService.getAssures();
        setAssures(data);
      } catch {
        setError("Erreur lors du chargement des assurés");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assures.filter(a => {
      const matchSearch = !q
        || (a.nom  || "").toLowerCase().includes(q)
        || (a.prenom || "").toLowerCase().includes(q)
        || (a.numero || "").toLowerCase().includes(q)
        || (a.pieceIdentite || "").toLowerCase().includes(q)
        || (a.lien || "").toLowerCase().includes(q)
        || (a.secteur || "").toLowerCase().includes(q);

      const matchType   = typeFilter   === "all" || (a.type   || "").toUpperCase() === typeFilter;
      const matchStatut = statutFilter === "all" || (a.statut || "").toUpperCase() === statutFilter;
      return matchSearch && matchType && matchStatut;
    });
  }, [assures, search, typeFilter, statutFilter]);

  // Stats rapides
  const nbFamille = assures.filter(a => (a.type || "").toUpperCase() === "FAMILLE").length;
  const nbGroupe  = assures.filter(a => (a.type || "").toUpperCase() === "GROUPE").length;
  const nbActif   = assures.filter(a => (a.statut || "").toUpperCase() === "ACTIF").length;

  return (
    <AppLayout title="Gestion des Assurés">
      <div className="space-y-4 w-full">

        {/* ── Statistiques rapides ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total assurés", value: assures.length, icon: <Users size={16} />, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Famille",       value: nbFamille,      icon: <UserCheck size={16} />, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Actifs",        value: nbActif,        icon: <UserCheck size={16} />, color: "text-green-600", bg: "bg-green-50" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border p-3 flex items-center gap-3 ${s.bg}`}>
              <div className={`p-2 rounded-lg bg-white/70 ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Barre d'actions ── */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border bg-card text-sm">
              <Search size={14} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nom, N° assuré, CNI, lien…"
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`p-2 rounded-lg border transition-colors shrink-0 ${showFilters ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-card hover:bg-muted text-muted-foreground"}`}
            >
              <Filter size={14} />
            </button>
          </div>
          <button
            onClick={() => navigate('/assures/new')}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium shadow-sm transition-all whitespace-nowrap"
          >
            <Plus size={14} /> Nouvel assuré
          </button>
        </div>

        {/* ── Filtres ── */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-3 bg-muted/40 rounded-xl border text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">Type :</span>
              {(["all", "FAMILLE", "GROUPE"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${typeFilter === t ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"}`}
                >
                  {t === "all" ? "Tous" : typeLabel[t]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs font-medium">Statut :</span>
              {(["all", "ACTIF", "SUSPENDU", "RESILIE"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatutFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${statutFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"}`}
                >
                  {s === "all" ? "Tous" : s === "ACTIF" ? "Actif" : s === "SUSPENDU" ? "Suspendu" : "Résilié"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Chargement / Erreur ── */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Chargement…</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* ── Tableau ── */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl shadow-sm border overflow-hidden"
          >
            {/* Compteur résultats */}
            <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {filtered.length} assuré{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
                {(typeFilter !== "all" || statutFilter !== "all" || search) && ` sur ${assures.length}`}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline">Famille : {nbFamille}</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">Groupe : {nbGroupe}</span>
              </div>
            </div>

            {/* ── Tableau desktop ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-gray-50/80">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-10">N°</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground min-w-[160px]">Nom et Prénom</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-28">Date de naissance</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-12">Sexe</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground min-w-[120px]">N° pièce d'identité</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-24">Lien</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-28">Date d'adhésion</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-28 hidden xl:table-cell">Salaire</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-20 hidden lg:table-cell">Garantie</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-16">Type</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground w-20">Statut</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground w-12">Act.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${
                        (a.lien || "").toLowerCase() === "principal" ? "bg-blue-50/30" : ""
                      }`}
                      onClick={() => navigate(`/assures/${a.id}`)}
                    >
                      {/* N° */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">{i + 1}</td>

                      {/* Nom et Prénom */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                            {((a.prenom || a.nom || "?")[0] || "?").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{a.prenom} {a.nom}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{a.numero}</p>
                          </div>
                        </div>
                      </td>

                      {/* Date de naissance */}
                      <td className="py-2.5 px-3 text-muted-foreground">{fmtDate(a.dateNaissance)}</td>

                      {/* Sexe */}
                      <td className="py-2.5 px-3 text-muted-foreground">{a.sexe || "—"}</td>

                      {/* N° pièce d'identité */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">{a.pieceIdentite || "—"}</td>

                      {/* Lien */}
                      <td className="py-2.5 px-3">
                        {a.lien ? (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border ${lienStyle[a.lien] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                            {a.lien}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Date d'adhésion */}
                      <td className="py-2.5 px-3 text-muted-foreground">{fmtDate(a.dateAdhesion || a.dateDebut)}</td>

                      {/* Salaire */}
                      <td className="py-2.5 px-3 text-muted-foreground hidden xl:table-cell">
                        {a.salaire ? `${Number(a.salaire).toLocaleString("fr-FR")} F` : "—"}
                      </td>

                      {/* Garantie */}
                      <td className="py-2.5 px-3 hidden lg:table-cell">
                        {a.garantie ? (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            a.garantie === "Premium" ? "bg-amber-100 text-amber-700"
                            : a.garantie === "Confort" ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-700"
                          }`}>{a.garantie}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Type */}
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeStyle[(a.type || "").toUpperCase()] || "bg-gray-100 text-gray-600"}`}>
                          {typeLabel[(a.type || "").toUpperCase()] || a.type}
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${statutStyle[(a.statut || "").toUpperCase()] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {(a.statut || "").charAt(0).toUpperCase() + (a.statut || "").slice(1).toLowerCase().replace("resilie", "Résilié")}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/assures/${a.id}`); }}
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Vue carte mobile ── */}
            <div className="md:hidden space-y-2 p-3">
              {filtered.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/assures/${a.id}`)}
                  className="p-3 rounded-lg border hover:bg-muted/40 transition-colors cursor-pointer space-y-2 bg-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {((a.prenom || a.nom || "?")[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{a.prenom} {a.nom}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{a.numero}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${statutStyle[(a.statut || "").toUpperCase()] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {(a.statut || "ACTIF").charAt(0).toUpperCase() + (a.statut || "actif").slice(1).toLowerCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div><span className="text-muted-foreground">Naissance : </span>{fmtDate(a.dateNaissance)}</div>
                    <div><span className="text-muted-foreground">Sexe : </span>{a.sexe || "—"}</div>
                    <div><span className="text-muted-foreground">CNI : </span><span className="font-mono">{a.pieceIdentite || "—"}</span></div>
                    <div>
                      <span className="text-muted-foreground">Lien : </span>
                      {a.lien ? (
                        <span className={`inline-block px-1 rounded text-[10px] border ${lienStyle[a.lien] || "bg-gray-100 text-gray-700 border-gray-200"}`}>{a.lien}</span>
                      ) : "—"}
                    </div>
                    <div><span className="text-muted-foreground">Adhésion : </span>{fmtDate(a.dateAdhesion || a.dateDebut)}</div>
                    <div><span className="text-muted-foreground">Garantie : </span>{a.garantie || "—"}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── État vide ── */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 gap-2 text-muted-foreground">
                <Users size={32} className="opacity-20" />
                <p className="text-sm">Aucun assuré trouvé</p>
                {(search || typeFilter !== "all" || statutFilter !== "all") && (
                  <button
                    onClick={() => { setSearch(""); setTypeFilter("all"); setStatutFilter("all"); }}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
