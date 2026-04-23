import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Shield, FileText, Loader2, AlertCircle,
  Trash2, X, RefreshCw, XCircle, CheckCircle, Clock,
  Download, MessageCircle,
} from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// ─── Statuts ──────────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; badge: string; dot: string; icon: React.ReactNode }> = {
  ACTIVE:    { label: "Active",    badge: "bg-green-100 text-green-700",   dot: "bg-green-500",  icon: <CheckCircle className="w-3 h-3" /> },
  SUSPENDUE: { label: "Suspendue", badge: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500", icon: <Clock className="w-3 h-3" /> },
  INACTIVE:  { label: "Inactive",  badge: "bg-gray-100 text-gray-500",     dot: "bg-gray-400",   icon: <Clock className="w-3 h-3" /> },
  RESILIEE:  { label: "Résiliée",  badge: "bg-red-100 text-red-600",       dot: "bg-red-500",    icon: <XCircle className="w-3 h-3" /> },
};

const FILTERS = ["all", "ACTIVE", "SUSPENDUE", "INACTIVE", "RESILIEE"] as const;
type FilterKey = typeof FILTERS[number];

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Toutes", ACTIVE: "Actives", SUSPENDUE: "Suspendues",
  INACTIVE: "Inactives", RESILIEE: "Résiliées",
};

function fmtPrime(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M FCFA`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}k FCFA`;
  return `${val.toLocaleString("fr-FR")} FCFA`;
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

// ─── Génération attestation PDF ───────────────────────────────────────────────

function printAttestation(p: any) {
  const nom      = p.assure ? `${p.assure.nom} ${p.assure.prenom}` : "—";
  const numero   = p.numero || "—";
  const type     = p.type   || "—";
  const prime    = p.montantPrime != null ? fmtPrime(Number(p.montantPrime)) : "—";
  const statut   = (p.statut || "ACTIVE");
  const couv     = p.couverture || "—";
  const debut    = fmtDate(p.dateDebut || p.createdAt);
  const fin      = fmtDate(p.dateFin);
  const today    = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const origin   = window.location.origin;

  const win = window.open("", "", "width=860,height=900");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Attestation ${numero}</title>
    <meta charset="utf-8"/>
    <style>
      @page { margin: 0; size: A4; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
      .page { width: 210mm; min-height: 297mm; padding: 20mm 18mm; }
      .header { display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: 3px solid #2563eb; margin-bottom: 24px; }
      .header img { width: 60px; height: 60px; object-fit: contain; }
      .header-text h1 { font-size: 22pt; font-weight: 900; color: #2563eb; }
      .header-text p { font-size: 9pt; color: #64748b; margin-top: 2px; }
      .title-block { text-align: center; margin: 24px 0; }
      .title-block h2 { font-size: 17pt; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #1e293b; }
      .title-block .sub { font-size: 9pt; color: #64748b; margin-top: 6px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 24px 0; }
      .info-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
      .info-box.blue { border-left: 4px solid #2563eb; background: #eff6ff; }
      .info-box .label { font-size: 7pt; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
      .info-box .value { font-size: 11pt; font-weight: 700; color: #1e293b; }
      .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 9pt; font-weight: 700; background: ${statut === "ACTIVE" ? "#dcfce7" : "#fee2e2"}; color: ${statut === "ACTIVE" ? "#166534" : "#991b1b"}; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8; }
      .stamp { width: 90px; height: 90px; border: 2px dashed #cbd5e1; border-radius: 50%; margin-top: 20px; }
      .sign-block { text-align: right; }
      .sign-line { border-top: 2px solid #2563eb; width: 160px; margin: 40px 0 6px auto; }
      .sign-label { font-size: 8pt; color: #64748b; text-align: right; }
    </style>
  </head><body><div class="page">
    <div class="header">
      <img src="${origin}/logo.png" alt="Logo" onerror="this.style.display='none'" />
      <div class="header-text">
        <h1>Papy Services Assurances</h1>
        <p>République du Sénégal — Assurance Santé Digitale</p>
      </div>
    </div>
    <div class="title-block">
      <h2>Attestation d'Assurance</h2>
      <p class="sub">Délivrée le ${today}</p>
    </div>
    <div class="info-grid">
      <div class="info-box blue">
        <div class="label">Assuré(e)</div>
        <div class="value">${nom}</div>
      </div>
      <div class="info-box blue">
        <div class="label">N° Police</div>
        <div class="value">${numero}</div>
      </div>
      <div class="info-box">
        <div class="label">Type de couverture</div>
        <div class="value">${type}</div>
      </div>
      <div class="info-box">
        <div class="label">Prime mensuelle</div>
        <div class="value">${prime}</div>
      </div>
      <div class="info-box">
        <div class="label">Couverture</div>
        <div class="value">${couv}</div>
      </div>
      <div class="info-box">
        <div class="label">Statut</div>
        <div class="value"><span class="status-badge">${statut}</span></div>
      </div>
      <div class="info-box">
        <div class="label">Date de début</div>
        <div class="value">${debut}</div>
      </div>
      <div class="info-box">
        <div class="label">Date de fin</div>
        <div class="value">${fin}</div>
      </div>
    </div>
    <p style="font-size:9pt;color:#475569;line-height:1.6;margin-top:12px;">
      La présente attestation certifie que la personne désignée ci-dessus est couverte par une police d'assurance
      santé délivrée par <strong>Papy Services Assurances</strong>, conformément aux dispositions du Code CIMA
      et des réglementations de l'IPM/CNSS en vigueur au Sénégal.
    </p>
    <div class="sign-block">
      <div class="sign-line"></div>
      <div class="sign-label">Signature et cachet — Papy Services Assurances</div>
    </div>
    <div class="footer">
      <span>Papy Services Assurances · Tél : +221 33 123 45 67 · Dakar, Sénégal</span>
      <span>Document généré le ${today}</span>
    </div>
  </div></body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); win.close(); }, 400);
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function PolicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isClient = user?.role === "client";

  const [polices, setPolices]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<FilterKey>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = () => {
    setLoading(true); setError(false);
    DataService.getPolices()
      .then((list) => setPolices(list ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // ─── Actions admin ────────────────────────────────────────────────────────

  const updateStatus = async (p: any, newStatus: string, msg: string) => {
    setActioningId(String(p.id));
    try {
      await DataService.updatePolice(String(p.id), { ...p, statut: newStatus });
      setPolices((prev) => prev.map((x) => String(x.id) === String(p.id) ? { ...x, statut: newStatus } : x));
      toast({ title: msg, description: `Police ${p.numero} mise à jour.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier le statut.", variant: "destructive" });
    } finally { setActioningId(null); }
  };

  const handleDelete = async (p: any) => {
    if (!window.confirm(`Supprimer la police "${p.numero}" ?`)) return;
    setActioningId(String(p.id));
    try {
      await DataService.deletePolice(String(p.id));
      setPolices((prev) => prev.filter((x) => String(x.id) !== String(p.id)));
      toast({ title: "Police supprimée", description: `${p.numero} supprimée.` });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    } finally { setActioningId(null); }
  };

  // ─── Données filtrées ────────────────────────────────────────────────────────

  const filtered = polices.filter((p) => {
    const statut = (p.statut || "ACTIVE").toUpperCase();
    const nom = p.assure ? `${p.assure.nom} ${p.assure.prenom}`.toLowerCase() : "";
    return (filter === "all" || statut === filter)
        && (nom.includes(search.toLowerCase()) || (p.numero || "").toLowerCase().includes(search.toLowerCase()));
  });

  const counts = {
    total:      polices.length,
    actives:    polices.filter((p) => (p.statut || "ACTIVE") === "ACTIVE").length,
    suspendues: polices.filter((p) => p.statut === "SUSPENDUE").length,
    resiliees:  polices.filter((p) => p.statut === "RESILIEE").length,
  };

  const pageTitle = isClient ? "Mes Polices" : "Gestion des Polices";

  // ─── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <AppLayout title={pageTitle}>
      <div className="space-y-4 sm:space-y-5">

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Total",      value: counts.total,      color: "text-blue-600"   },
            { label: "Actives",    value: counts.actives,    color: "text-green-600"  },
            { label: "Suspendues", value: counts.suspendues, color: "text-yellow-600" },
            { label: "Résiliées",  value: counts.resiliees,  color: "text-red-600"    },
          ].map((c) => (
            <Card key={c.label} className="p-3 sm:p-4 text-center">
              <p className={`text-xl sm:text-2xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{c.label}</p>
            </Card>
          ))}
        </div>

        {/* ── Barre d'actions ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-input bg-card text-sm">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isClient ? "Rechercher par numéro..." : "Rechercher par nom, numéro..."}
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 text-sm"
              />
            </div>
          </div>

          {isClient ? (
            /* Client : redirection vers contact/agent */
            <button
              onClick={() => navigate("/contact")}
              title="Contactez votre agent pour souscrire une nouvelle police"
              className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium shadow-sm hover:shadow-md active:scale-95 transition-all duration-150 whitespace-nowrap shrink-0"
            >
              <MessageCircle size={15} />
              <span>Demander une nouvelle police</span>
            </button>
          ) : (
            /* Admin : création directe */
            <button
              onClick={() => navigate("/polices/new")}
              className="flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium shadow-sm hover:shadow-md active:scale-95 transition-all duration-150 whitespace-nowrap shrink-0"
            >
              <Plus size={15} />
              <span>Nouvelle police</span>
            </button>
          )}
        </div>

        {/* ── Filtres ────────────────────────────────────────────────── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {FILTER_LABELS[key]}
            </button>
          ))}
        </div>

        {/* ── Compteur ───────────────────────────────────────────────── */}
        {!loading && !error && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            police{filtered.length !== 1 ? "s" : ""}
            {(search || filter !== "all") ? " trouvée" + (filtered.length !== 1 ? "s" : "") : " au total"}
          </p>
        )}

        {/* ── Note client ────────────────────────────────────────────── */}
        {isClient && !loading && !error && polices.length > 0 && (
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
            <Shield size={15} className="mt-0.5 shrink-0 text-blue-600" />
            <p>
              Pour modifier vos informations personnelles, rendez-vous dans{" "}
              <button onClick={() => navigate("/profile")} className="font-semibold underline underline-offset-2">
                Mon Profil
              </button>
              . Pour renouveler ou modifier une police, contactez votre agent.
            </p>
          </div>
        )}

        {/* ── États ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : error ? (
          <Card className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="font-medium text-sm text-red-600">Impossible de charger les polices</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={load}>Réessayer</Button>
          </Card>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <FileText size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold">
              {search || filter !== "all" ? "Aucune police ne correspond" : "Aucune police enregistrée"}
            </p>
            {isClient && !search && filter === "all" && (
              <Button size="sm" onClick={() => navigate("/contact")} className="mt-1 gap-2">
                <MessageCircle size={14} />
                Contacter mon agent
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop : tableau */}
            <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Numéro</th>
                    {!isClient && <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assuré</th>}
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prime</th>
                    {isClient && <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Couverture</th>}
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">
                      {isClient ? "Fin validité" : "Créée le"}
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const statut = (p.statut || "ACTIVE").toUpperCase();
                    const cfg    = STATUS[statut] ?? STATUS.ACTIVE;
                    const isBusy = actioningId === String(p.id);
                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{p.numero}</td>
                        {!isClient && (
                          <td className="py-3 px-4">
                            <p className="font-medium text-sm truncate max-w-[180px]">
                              {p.assure ? `${p.assure.nom} ${p.assure.prenom}` : "—"}
                            </p>
                          </td>
                        )}
                        <td className="py-3 px-4 hidden lg:table-cell text-sm">{p.type || "—"}</td>
                        <td className="py-3 px-4 font-semibold text-blue-600 text-sm whitespace-nowrap">
                          {p.montantPrime != null ? fmtPrime(Number(p.montantPrime)) : "—"}
                        </td>
                        {isClient && (
                          <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                            {p.couverture || "—"}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-xs text-muted-foreground">
                          {isClient
                            ? fmtDate(p.dateFin)
                            : (p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "—")
                          }
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isClient ? (
                            /* Actions client : lecture seule */
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm" variant="outline"
                                className="h-8 text-xs gap-1.5"
                                title="Télécharger l'attestation d'assurance"
                                onClick={() => printAttestation(p)}
                              >
                                <Download className="w-3 h-3" />
                                Attestation
                              </Button>
                              {statut === "ACTIVE" && (
                                <Button
                                  size="sm" variant="outline"
                                  className="h-8 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  title="Demander le renouvellement de cette police"
                                  onClick={() => navigate("/contact")}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Renouveler
                                </Button>
                              )}
                            </div>
                          ) : (
                            /* Actions admin */
                            <div className="flex items-center justify-end gap-0.5">
                              {statut === "ACTIVE" && (
                                <Button size="sm" variant="ghost" title="Suspendre" disabled={isBusy}
                                  className="text-yellow-600 hover:bg-yellow-50 h-8 w-8 p-0"
                                  onClick={() => updateStatus(p, "SUSPENDUE", "Police suspendue")}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {(statut === "SUSPENDUE" || statut === "INACTIVE") && (
                                <Button size="sm" variant="ghost" title="Réactiver" disabled={isBusy}
                                  className="text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                                  onClick={() => updateStatus(p, "ACTIVE", "Police réactivée")}>
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {statut !== "RESILIEE" && (
                                <Button size="sm" variant="ghost" title="Résilier" disabled={isBusy}
                                  className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                  onClick={() => updateStatus(p, "RESILIEE", "Police résiliée")}>
                                  <XCircle className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" title="Supprimer" disabled={isBusy}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={() => handleDelete(p)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile : cartes */}
            <div className="md:hidden space-y-3">
              {filtered.map((p, i) => {
                const statut = (p.statut || "ACTIVE").toUpperCase();
                const cfg    = STATUS[statut] ?? STATUS.ACTIVE;
                const isBusy = actioningId === String(p.id);
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-card rounded-xl border p-4 space-y-3 ${
                      statut === "SUSPENDUE" ? "border-yellow-300" :
                      statut === "RESILIEE"  ? "border-red-200"    : "border-border"
                    }`}
                  >
                    {/* Ligne 1 : icône + infos + badge */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Shield size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-muted-foreground truncate">{p.numero}</p>
                        {!isClient && (
                          <p className="font-semibold text-sm truncate mt-0.5">
                            {p.assure ? `${p.assure.nom} ${p.assure.prenom}` : "Assuré inconnu"}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.badge}`}>
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    {/* Ligne 2 : détails */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium truncate">{p.type || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Prime</p>
                        <p className="font-semibold text-blue-600">
                          {p.montantPrime != null ? fmtPrime(Number(p.montantPrime)) : "—"}
                        </p>
                      </div>
                      {p.couverture && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Couverture</p>
                          <p className="truncate">{p.couverture}</p>
                        </div>
                      )}
                      {isClient && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Fin de validité</p>
                          <p className="font-medium">{fmtDate(p.dateFin)}</p>
                        </div>
                      )}
                    </div>

                    {/* Ligne 3 : date + actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {isClient
                          ? `Depuis le ${fmtDate(p.dateDebut || p.createdAt)}`
                          : (p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : "—")
                        }
                      </span>
                      <div className="flex items-center gap-1">
                        {isClient ? (
                          <>
                            <Button
                              size="sm" variant="outline"
                              className="h-8 text-xs gap-1"
                              onClick={() => printAttestation(p)}
                            >
                              <Download className="w-3 h-3" />
                              Attestation
                            </Button>
                            {statut === "ACTIVE" && (
                              <Button
                                size="sm" variant="outline"
                                className="h-8 text-xs gap-1 text-blue-600 border-blue-200"
                                onClick={() => navigate("/contact")}
                              >
                                <RefreshCw className="w-3 h-3" />
                                Renouveler
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            {statut === "ACTIVE" && (
                              <Button size="sm" variant="ghost" title="Suspendre" disabled={isBusy}
                                className="text-yellow-600 hover:bg-yellow-50 h-8 w-8 p-0"
                                onClick={() => updateStatus(p, "SUSPENDUE", "Police suspendue")}>
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            {(statut === "SUSPENDUE" || statut === "INACTIVE") && (
                              <Button size="sm" variant="ghost" title="Réactiver" disabled={isBusy}
                                className="text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                                onClick={() => updateStatus(p, "ACTIVE", "Police réactivée")}>
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            {statut !== "RESILIEE" && (
                              <Button size="sm" variant="ghost" title="Résilier" disabled={isBusy}
                                className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={() => updateStatus(p, "RESILIEE", "Police résiliée")}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" title="Supprimer" disabled={isBusy}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                              onClick={() => handleDelete(p)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
