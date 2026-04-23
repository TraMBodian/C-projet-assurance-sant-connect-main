import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Pill, FileText, Loader2, AlertCircle, Download, Eye, Phone, MapPin } from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";

export default function PrescriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClient = user?.role === "client";

  const [search, setSearch] = useState("");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    DataService.getPrescriptions()
      .then((list) => setPrescriptions(list ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const assureNom = (p: any) => {
    const assure = p.consultation?.assure;
    return assure ? `${assure.nom} ${assure.prenom}` : "";
  };

  const filtered = prescriptions.filter((p) => {
    const q = search.toLowerCase();
    return (
      assureNom(p).toLowerCase().includes(q) ||
      (p.medicament || "").toLowerCase().includes(q) ||
      (p.consultation?.prestataire?.nom || "").toLowerCase().includes(q)
    );
  });

  const downloadPrescription = (p: any) => {
    const nom          = (() => { const a = p.consultation?.assure; return a ? `${a.nom} ${a.prenom}` : "—"; })();
    const medecin      = p.consultation?.prestataire?.nom ?? "—";
    const spec         = p.consultation?.prestataire?.specialite ?? "";
    const tel          = p.consultation?.assure?.telephone ?? "";
    const prestLogo    = p.consultation?.prestataire?.logo ?? "";
    const date         = p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
    const num          = `ORD-${String(p.id ?? "???").padStart(4, "0")}`;
    const origin       = window.location.origin;

    const win = window.open("", "", "width=860,height=1050");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Ordonnance ${num}</title>
      <meta charset="utf-8"/>
      <style>
        @page { margin:0; size:A4; }
        *{ margin:0; padding:0; box-sizing:border-box; }
        body{ font-family:'Segoe UI',Arial,sans-serif; color:#1e293b; background:#fff; }
        .page{ width:210mm; min-height:297mm; display:flex; }
        .sidebar{ width:58mm; background:#1d4ed8; color:#fff; padding:28px 16px; display:flex; flex-direction:column; gap:18px; }
        .logos-row{ display:flex; align-items:center; gap:10px; justify-content:center; flex-wrap:wrap; }
        .logo-item{ text-align:center; flex:1; min-width:60px; }
        .logo-item img{ width:54px; border-radius:8px; background:#fff; padding:5px; }
        .logo-item .logo-name{ font-size:7pt; opacity:.85; margin-top:4px; line-height:1.3; font-weight:600; }
        .logo-divider{ width:1px; height:50px; background:rgba(255,255,255,.3); }
        .sidebar-brand{ margin-top:8px; text-align:center; }
        .sidebar-brand h2{ font-size:10.5pt; font-weight:800; line-height:1.2; }
        .sidebar-brand p{ font-size:7.5pt; opacity:.8; margin-top:3px; line-height:1.4; }
        .sidebar-sep{ border:none; border-top:1px solid rgba(255,255,255,.25); }
        .sidebar-section h3{ font-size:6.5pt; text-transform:uppercase; letter-spacing:1px; opacity:.65; margin-bottom:7px; font-weight:700; }
        .sidebar-section p{ font-size:8.5pt; line-height:1.5; }
        .sidebar-section .val{ font-weight:700; font-size:9pt; }
        .badge-valid{ margin-top:auto; background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.35); border-radius:8px; padding:10px 12px; text-align:center; }
        .badge-valid p{ font-size:7.5pt; line-height:1.5; opacity:.9; }
        .badge-valid strong{ font-size:9pt; display:block; margin-bottom:2px; }
        .main{ flex:1; padding:28px 24px; display:flex; flex-direction:column; }
        .main-header{ display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; padding-bottom:14px; border-bottom:3px solid #1d4ed8; }
        .main-header h1{ font-size:19pt; font-weight:900; color:#1d4ed8; letter-spacing:-0.5px; line-height:1.1; }
        .main-header .sub{ font-size:7.5pt; color:#64748b; margin-top:4px; }
        .ord-badge{ background:#eff6ff; border:1.5px solid #93c5fd; border-radius:8px; padding:5px 12px; text-align:right; }
        .ord-badge .num{ font-family:monospace; font-size:10pt; font-weight:800; color:#1d4ed8; }
        .ord-badge .dt{ font-size:7.5pt; color:#64748b; margin-top:2px; }
        .info-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
        .info-box{ border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; }
        .info-box.patient{ border-left:3.5px solid #2563eb; background:#eff6ff; }
        .info-box.medecin{ border-left:3.5px solid #7c3aed; background:#f5f3ff; }
        .info-box .lbl{ font-size:6.5pt; text-transform:uppercase; letter-spacing:.8px; font-weight:700; color:#94a3b8; margin-bottom:3px; }
        .info-box .val{ font-size:10.5pt; font-weight:800; color:#1e293b; }
        .info-box .sub{ font-size:7.5pt; color:#64748b; margin-top:2px; }
        .rx-header{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .rx-sym{ font-family:Georgia,serif; font-size:26pt; font-weight:700; color:#1d4ed8; line-height:1; }
        .rx-title{ font-size:11.5pt; font-weight:800; color:#1e293b; }
        .med-card{ border:1.5px solid #93c5fd; border-left:5px solid #1d4ed8; border-radius:10px; padding:14px 16px; background:#f0f7ff; margin-bottom:14px; }
        .med-name{ font-size:14pt; font-weight:900; color:#1d4ed8; margin-bottom:10px; }
        .med-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .med-item .dl{ font-size:7pt; text-transform:uppercase; letter-spacing:.6px; color:#94a3b8; font-weight:700; margin-bottom:2px; }
        .med-item .dv{ font-size:10pt; font-weight:700; color:#1e293b; }
        .instructions-box{ border:1.5px solid #fde68a; background:#fffbeb; border-radius:10px; padding:12px 14px; margin-bottom:16px; }
        .instructions-box .il{ font-size:7pt; font-weight:800; text-transform:uppercase; letter-spacing:.6px; color:#92400e; margin-bottom:5px; }
        .instructions-box .iv{ font-size:9pt; color:#78350f; line-height:1.5; }
        .spacer{ flex:1; min-height:20px; }
        .sign-row{ display:flex; justify-content:flex-end; padding-top:14px; border-top:1px solid #e2e8f0; margin-bottom:12px; }
        .sign-block{ text-align:center; width:180px; }
        .sign-line{ border-top:2px solid #1d4ed8; margin-bottom:6px; height:36px; }
        .sign-lbl{ font-size:7.5pt; color:#64748b; }
        .footer{ display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px dashed #cbd5e1; }
        .footer .validity{ font-size:7.5pt; color:#94a3b8; font-style:italic; }
        .stamp-circle{ width:72px; height:72px; border-radius:50%; border:2px dashed #cbd5e1; }
      </style>
    </head><body>
    <div class="page">
      <div class="sidebar">
        <div class="logos-row">
          <div class="logo-item">
            <img src="${origin}/logo.png" alt="ASC" onerror="this.style.display='none'" />
            <div class="logo-name">Assurance<br/>Santé Connect</div>
          </div>
          ${prestLogo ? `
          <div class="logo-divider"></div>
          <div class="logo-item">
            <img src="${prestLogo}" alt="${medecin}" onerror="this.style.display='none'" />
            <div class="logo-name">${medecin}</div>
          </div>` : `
          <div class="logo-divider"></div>
          <div class="logo-item">
            <div class="logo-name" style="font-size:8.5pt;font-weight:800;opacity:1;">${medecin}</div>
            ${spec ? `<div class="logo-name">${spec}</div>` : ""}
          </div>`}
        </div>
        <hr class="sidebar-sep"/>
        <div class="sidebar-section">
          <h3>Numéro</h3>
          <p class="val">${num}</p>
        </div>
        <div class="sidebar-section">
          <h3>Date d'émission</h3>
          <p class="val">${date}</p>
        </div>
        ${p.consultation?.motif ? `<div class="sidebar-section"><h3>Motif</h3><p>${p.consultation.motif}</p></div>` : ""}
        <div class="badge-valid">
          <strong>⏱ Validité</strong>
          <p>Ordonnance valable<br/><strong>30 jours</strong> à compter de la date d'émission</p>
        </div>
      </div>
      <div class="main">
        <div class="main-header">
          <div>
            <h1>ORDONNANCE<br/>MÉDICALE</h1>
            <p class="sub">République du Sénégal — Ministère de la Santé et de l'Action Sociale</p>
          </div>
          <div class="ord-badge">
            <div class="num">${num}</div>
            <div class="dt">${date}</div>
          </div>
        </div>
        <div class="info-grid">
          <div class="info-box patient">
            <div class="lbl">Patient</div>
            <div class="val">${nom}</div>
            ${tel ? `<div class="sub">${tel}</div>` : ""}
          </div>
          <div class="info-box medecin">
            <div class="lbl">Dr</div>
            <div class="val">${medecin}</div>
            ${spec ? `<div class="sub">${spec}</div>` : ""}
          </div>
        </div>
        <div class="rx-header">
          <div class="rx-sym">&#8478;</div>
          <div class="rx-title">Médicament prescrit</div>
        </div>
        <div class="med-card">
          <div class="med-name">${p.medicament || "—"}</div>
          <div class="med-grid">
            <div class="med-item">
              <div class="dl">Posologie / Dosage</div>
              <div class="dv">${p.dosage || "—"}</div>
            </div>
            <div class="med-item">
              <div class="dl">Durée du traitement</div>
              <div class="dv">${p.duree || "—"}</div>
            </div>
          </div>
        </div>
        ${p.instructions ? `<div class="instructions-box"><div class="il">Instructions particulières</div><div class="iv">${p.instructions}</div></div>` : ""}
        <div class="spacer"></div>
        <div class="sign-row">
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-lbl">Signature et cachet</div>
          </div>
        </div>
        <div class="footer">
          <div class="validity">Assurance Santé Connect — Tél : +221 33 123 45 67<br/>Cette ordonnance est valable 30 jours à compter de la date d'émission</div>
          <div class="stamp-circle"></div>
        </div>
      </div>
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  return (
    <AppLayout title={isClient ? "Mes Prescriptions" : "Gestion des Ordonnances"}>
      <div className="space-y-4 sm:space-y-5">

        {/* ── Bandeau info client ─────────────────────────────────────── */}
        {isClient && (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <Pill size={16} className="text-blue-600 shrink-0 hidden sm:block" />
            <p className="flex-1">
              Vos ordonnances sont établies par votre médecin lors d'une consultation.
              Pour une nouvelle prescription, prenez rendez-vous avec un prestataire.
            </p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline"
                className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 gap-1.5"
                onClick={() => navigate("/contact")}
              >
                <Phone size={13} />
                Contacter un médecin
              </Button>
              <Button size="sm" variant="outline"
                className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 gap-1.5"
                onClick={() => window.open("https://maps.google.com/?q=pharmacie+Dakar+Sénégal", "_blank")}
              >
                <MapPin size={13} />
                Pharmacie proche
              </Button>
            </div>
          </div>
        )}

        {/* ── Compteurs ──────────────────────────────────────────────── */}
        {!loading && !error && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Total",        value: prescriptions.length, bg: "bg-green-50",  border: "border-green-200", num: "text-green-900", sub: "text-green-700",  icon: <Pill size={15} />,      iconBg: "bg-green-600" },
              { label: "Consultations",value: new Set(prescriptions.map(p => p.consultation?.id).filter(Boolean)).size, bg: "bg-blue-50", border: "border-blue-200", num: "text-blue-900", sub: "text-blue-700", icon: <FileText size={15} />, iconBg: "bg-blue-600" },
              { label: "Patients",     value: new Set(prescriptions.map(p => p.consultation?.assure?.id).filter(Boolean)).size, bg: "bg-purple-50", border: "border-purple-200", num: "text-purple-900", sub: "text-purple-700", icon: <FileText size={15} />, iconBg: "bg-purple-600" },
            ].map(c => (
              <div key={c.label} className={`${c.bg} border ${c.border} rounded-xl p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 ${c.iconBg} rounded-lg flex items-center justify-center text-white shrink-0`}>
                  {c.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-lg sm:text-2xl font-bold ${c.num} leading-none`}>{c.value}</p>
                  <p className={`text-xs sm:text-sm ${c.sub} truncate mt-0.5`}>{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Barre d'actions ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-input bg-card text-sm">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 text-sm"
              />
            </div>
          </div>
          {isClient ? (
            <Button
              variant="outline"
              className="whitespace-nowrap shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50 gap-1.5"
              onClick={() => navigate("/contact")}
              title="Les ordonnances sont créées par votre médecin — contactez votre prestataire"
            >
              <Phone size={15} />
              <span>Prendre rendez-vous</span>
            </Button>
          ) : (
            <Button
              className="whitespace-nowrap shrink-0"
              onClick={() => navigate("/prescriptions/new")}
            >
              <Plus size={15} className="mr-1.5" />
              <span className="hidden sm:inline">Nouvelle ordonnance</span>
              <span className="sm:hidden">Nouvelle</span>
            </Button>
          )}
        </div>

        {/* ── États ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-4">
            <AlertCircle size={36} className="text-destructive opacity-60" />
            <p className="font-medium text-sm">Impossible de charger les ordonnances</p>
            <p className="text-xs text-muted-foreground">Service temporairement indisponible</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <Pill size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold">{search ? "Aucun résultat" : "Aucune ordonnance enregistrée"}</p>
            {!search && (
              <p className="text-sm text-muted-foreground max-w-sm">
                Les ordonnances sont créées à partir des consultations médicales.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-4 sm:p-5 border border-border hover:shadow-md transition-shadow"
              >
                {/* En-tête */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white shrink-0">
                    <Pill size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm sm:text-base">{assureNom(p) || "Patient inconnu"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.createdAt ? `Prescrit le ${new Date(p.createdAt).toLocaleDateString("fr-FR")}` : "—"}
                    </p>
                    {p.consultation?.prestataire?.nom && (
                      <p className="text-xs text-muted-foreground truncate">Dr. {p.consultation.prestataire.nom}</p>
                    )}
                  </div>
                </div>

                {/* Médicament */}
                <div className="bg-muted/40 rounded-lg p-2.5 sm:p-3 mb-3">
                  <p className="font-semibold text-sm truncate">{p.medicament || "—"}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span>Dosage : <span className="text-foreground font-medium">{p.dosage || "—"}</span></span>
                    <span>Durée : <span className="text-foreground font-medium">{p.duree || "—"}</span></span>
                  </div>
                </div>

                {p.instructions && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    <span className="font-medium text-foreground">Instructions :</span> {p.instructions}
                  </p>
                )}

                {/* Actions */}
                <div className="border-t pt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadPrescription(p)} className="text-xs h-8">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Télécharger
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/prescriptions/${p.id}`)} className="text-xs h-8">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Détails
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
