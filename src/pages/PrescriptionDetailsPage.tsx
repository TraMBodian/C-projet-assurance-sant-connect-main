import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pill, User, FileText, Download, Printer, Loader2, Calendar, Stethoscope, Clock } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/services/apiClient";

export default function PrescriptionDetailsPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient.request<any>(`/prescriptions/${id}`)
      .then(data => setPrescription(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const assureNom   = () => { const a = prescription?.consultation?.assure; return a ? `${a.nom} ${a.prenom}` : "—"; };
  const medecinNom  = () => prescription?.consultation?.prestataire?.nom ?? "—";
  const medecinSpec = () => prescription?.consultation?.prestataire?.specialite ?? "";
  const prestLogo   = () => prescription?.consultation?.prestataire?.logo ?? "";
  const patientTel  = () => prescription?.consultation?.assure?.telephone ?? "";
  const dateStr = () => {
    const d = prescription?.consultation?.dateConsultation || prescription?.createdAt;
    return d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  };
  const numero = () => `ORD-${String(prescription?.id ?? "???").padStart(4, "0")}`;

  // ── Impression moderne ────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!prescription) return;
    const origin = window.location.origin;
    const win = window.open("", "", "width=860,height=1050");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Ordonnance ${numero()}</title>
      <meta charset="utf-8"/>
      <style>
        @page { margin: 0; size: A4; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background:#fff; }
        .page { width:210mm; min-height:297mm; display:flex; }

        /* Colonne gauche */
        .sidebar {
          width:58mm; background:#1d4ed8; color:#fff;
          padding:28px 16px; display:flex; flex-direction:column; gap:18px;
        }
        .logos-row { display:flex; align-items:center; justify-content:center; gap:10px; flex-wrap:wrap; }
        .logo-item { text-align:center; flex:1; min-width:60px; }
        .logo-item img { width:54px; border-radius:8px; background:#fff; padding:5px; }
        .logo-item .logo-name { font-size:7pt; opacity:.85; margin-top:4px; line-height:1.3; font-weight:600; }
        .logo-divider { width:1px; height:50px; background:rgba(255,255,255,.3); }
        .sidebar-brand { margin-top:8px; text-align:center; }
        .sidebar-brand h2 { font-size:10.5pt; font-weight:800; line-height:1.2; }
        .sidebar-brand p  { font-size:7.5pt; opacity:.8; margin-top:3px; line-height:1.4; }
        .sidebar-sep { border:none; border-top:1px solid rgba(255,255,255,.25); }
        .sidebar-section h3 {
          font-size:6.5pt; text-transform:uppercase; letter-spacing:1px;
          opacity:.65; margin-bottom:7px; font-weight:700;
        }
        .sidebar-section p { font-size:8.5pt; line-height:1.5; }
        .sidebar-section .val { font-weight:700; font-size:9pt; }
        .badge-valid {
          margin-top:auto; background:rgba(255,255,255,.15);
          border:1px solid rgba(255,255,255,.35); border-radius:8px;
          padding:10px 12px; text-align:center;
        }
        .badge-valid p { font-size:7.5pt; line-height:1.5; opacity:.9; }
        .badge-valid strong { font-size:9pt; display:block; margin-bottom:2px; }

        /* Colonne principale */
        .main { flex:1; padding:28px 24px; display:flex; flex-direction:column; }
        .main-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; padding-bottom:14px; border-bottom:3px solid #1d4ed8; }
        .main-header h1 { font-size:19pt; font-weight:900; color:#1d4ed8; letter-spacing:-0.5px; line-height:1; }
        .main-header .sub { font-size:7.5pt; color:#64748b; margin-top:4px; }
        .ord-badge { background:#eff6ff; border:1.5px solid #93c5fd; border-radius:8px; padding:5px 12px; text-align:right; }
        .ord-badge .num { font-family:monospace; font-size:10pt; font-weight:800; color:#1d4ed8; }
        .ord-badge .date-line { font-size:7.5pt; color:#64748b; margin-top:2px; }

        .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
        .info-box { border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; }
        .info-box.patient { border-left:3.5px solid #2563eb; background:#eff6ff; }
        .info-box.medecin { border-left:3.5px solid #7c3aed; background:#f5f3ff; }
        .info-box .lbl { font-size:6.5pt; text-transform:uppercase; letter-spacing:.8px; font-weight:700; color:#94a3b8; margin-bottom:3px; }
        .info-box .val { font-size:10.5pt; font-weight:800; color:#1e293b; }
        .info-box .sub { font-size:7.5pt; color:#64748b; margin-top:2px; }

        .rx-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .rx-sym { font-family:Georgia,serif; font-size:26pt; font-weight:700; color:#1d4ed8; line-height:1; }
        .rx-title { font-size:11.5pt; font-weight:800; color:#1e293b; }

        .med-card {
          border:1.5px solid #93c5fd; border-left:5px solid #1d4ed8;
          border-radius:10px; padding:14px 16px; background:#f0f7ff; margin-bottom:14px;
        }
        .med-name { font-size:14pt; font-weight:900; color:#1d4ed8; margin-bottom:10px; }
        .med-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .med-item .dl { font-size:7pt; text-transform:uppercase; letter-spacing:.6px; color:#94a3b8; font-weight:700; margin-bottom:2px; }
        .med-item .dv { font-size:10pt; font-weight:700; color:#1e293b; }

        .instructions-box {
          border:1.5px solid #fde68a; background:#fffbeb; border-radius:10px; padding:12px 14px; margin-bottom:16px;
        }
        .instructions-box .il { font-size:7pt; font-weight:800; text-transform:uppercase; letter-spacing:.6px; color:#92400e; margin-bottom:5px; }
        .instructions-box .iv { font-size:9pt; color:#78350f; line-height:1.5; }

        .spacer { flex:1; min-height:20px; }

        .sign-row { display:flex; justify-content:flex-end; padding-top:14px; border-top:1px solid #e2e8f0; margin-bottom:12px; }
        .sign-block { text-align:center; width:180px; }
        .sign-line { border-top:2px solid #1d4ed8; margin-bottom:6px; height:36px; }
        .sign-lbl { font-size:7.5pt; color:#64748b; }

        .footer { display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px dashed #cbd5e1; }
        .footer .validity { font-size:7.5pt; color:#94a3b8; font-style:italic; }
        .stamp-circle { width:72px; height:72px; border-radius:50%; border:2px dashed #cbd5e1; }
      </style>
    </head><body>
    <div class="page">
      <div class="sidebar">
        <div class="logos-row">
          <div class="logo-item">
            <img src="${origin}/logo.png" alt="ASC" onerror="this.style.display='none'" />
            <div class="logo-name">Assurance<br/>Santé Connect</div>
          </div>
          ${prestLogo() ? `
          <div class="logo-divider"></div>
          <div class="logo-item">
            <img src="${prestLogo()}" alt="${medecinNom()}" onerror="this.style.display='none'" />
            <div class="logo-name">${medecinNom()}</div>
          </div>` : `
          <div class="logo-divider"></div>
          <div class="logo-item">
            <div class="logo-name" style="font-size:8.5pt;font-weight:800;opacity:1;">${medecinNom()}</div>
            ${medecinSpec() ? `<div class="logo-name">${medecinSpec()}</div>` : ""}
          </div>`}
        </div>
        <hr class="sidebar-sep"/>
        <div class="sidebar-section">
          <h3>Numéro</h3>
          <p class="val">${numero()}</p>
        </div>
        <div class="sidebar-section">
          <h3>Date d'émission</h3>
          <p class="val">${dateStr()}</p>
        </div>
        <div class="sidebar-section">
          <h3>Motif de consultation</h3>
          <p>${prescription.consultation?.motif || "—"}</p>
        </div>
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
            <div class="num">${numero()}</div>
            <div class="date-line">${dateStr()}</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box patient">
            <div class="lbl">Patient</div>
            <div class="val">${assureNom()}</div>
            ${patientTel() ? `<div class="sub">${patientTel()}</div>` : ""}
          </div>
          <div class="info-box medecin">
            <div class="lbl">Dr</div>
            <div class="val">${medecinNom()}</div>
            ${medecinSpec() ? `<div class="sub">${medecinSpec()}</div>` : ""}
          </div>
        </div>

        <div class="rx-header">
          <div class="rx-sym">&#8478;</div>
          <div class="rx-title">Médicament prescrit</div>
        </div>

        <div class="med-card">
          <div class="med-name">${prescription.medicament}</div>
          <div class="med-grid">
            <div class="med-item">
              <div class="dl">Posologie / Dosage</div>
              <div class="dv">${prescription.dosage}</div>
            </div>
            <div class="med-item">
              <div class="dl">Durée du traitement</div>
              <div class="dv">${prescription.duree}</div>
            </div>
          </div>
        </div>

        ${prescription.instructions ? `
        <div class="instructions-box">
          <div class="il">Instructions particulières</div>
          <div class="iv">${prescription.instructions}</div>
        </div>` : ""}

        <div class="spacer"></div>

        <div class="sign-row">
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-lbl">Signature et cachet</div>
          </div>
        </div>

        <div class="footer">
          <div class="validity">
            Assurance Santé Connect — Tél : +221 33 123 45 67<br/>
            Cette ordonnance est valable 30 jours à compter de la date d'émission
          </div>
          <div class="stamp-circle"></div>
        </div>
      </div>
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  // ── Download PNG ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!prescription) return;
    const W = 794, H = 1123;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const doRender = (logoImg: HTMLImageElement | null) => {
      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // Sidebar
      const SW = 200;
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(0, 0, SW, H);

      // Logo in sidebar
      if (logoImg) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, 20, 24, 160, 80, 10);
        ctx.fill();
        const lw = 140, lh = 70;
        ctx.drawImage(logoImg, 30, 29, lw, lh);
        ctx.restore();
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        roundRect(ctx, 20, 24, 160, 80, 10);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Assurance Santé Connect", SW / 2, 70);
        ctx.textAlign = "left";
      }

      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(20, 120, SW - 40, 1);

      // Sidebar labels
      const sLabel = (label: string, value: string, y: number) => {
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.font = "10px Arial";
        ctx.fillText(label.toUpperCase(), 20, y);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 12px Arial";
        ctx.fillText(value, 20, y + 18);
      };

      sLabel("Numéro", numero(), 140);
      sLabel("Date d'émission", dateStr(), 182);
      sLabel("Motif", prescription.consultation?.motif || "—", 224);

      // Valid badge at bottom of sidebar
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      roundRect(ctx, 12, H - 130, SW - 24, 110, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      roundRect(ctx, 12, H - 130, SW - 24, 110, 10);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText("⏱ Validité", SW / 2, H - 108);
      ctx.font = "9px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("Ordonnance valable 30 jours", SW / 2, H - 88);
      ctx.fillText("à compter de la date d'émission", SW / 2, H - 73);
      ctx.textAlign = "left";

      // Main content area
      const MX = SW + 24, MW = W - MX - 20;
      let y = 30;

      // Title
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 28px Arial";
      ctx.fillText("ORDONNANCE", MX, y + 28);
      ctx.fillText("MÉDICALE", MX, y + 60);
      ctx.fillStyle = "#64748b";
      ctx.font = "9px Arial";
      ctx.fillText("République du Sénégal — Ministère de la Santé et de l'Action Sociale", MX, y + 78);

      // Ord badge
      ctx.fillStyle = "#eff6ff";
      roundRect(ctx, W - 150, y, 130, 46, 8);
      ctx.fill();
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 1.5;
      roundRect(ctx, W - 150, y, 130, 46, 8);
      ctx.stroke();
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(numero(), W - 85, y + 18);
      ctx.fillStyle = "#64748b";
      ctx.font = "9px Arial";
      ctx.fillText(dateStr(), W - 85, y + 34);
      ctx.textAlign = "left";

      y += 100;
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(MX, y, MW, 3);
      y += 20;

      // Patient / Médecin boxes
      const bw = (MW - 12) / 2;
      const infoBox = (label: string, val: string, sub: string, bx: number, by: number, color: string) => {
        ctx.fillStyle = color === "blue" ? "#eff6ff" : "#f5f3ff";
        roundRect(ctx, bx, by, bw, 70, 8);
        ctx.fill();
        ctx.strokeStyle = color === "blue" ? "#93c5fd" : "#c4b5fd";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, 70);
        ctx.fillStyle = color === "blue" ? "#2563eb" : "#7c3aed";
        ctx.fillRect(bx, by, 4, 70);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "8px Arial";
        ctx.fillText(label.toUpperCase(), bx + 10, by + 16);
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 12px Arial";
        ctx.fillText(val, bx + 10, by + 34);
        if (sub) {
          ctx.fillStyle = "#64748b";
          ctx.font = "9px Arial";
          ctx.fillText(sub, bx + 10, by + 50);
        }
      };
      infoBox("Patient", assureNom(), patientTel(), MX, y, "blue");
      infoBox("Dr", medecinNom(), medecinSpec(), MX + bw + 12, y, "purple");
      y += 88;

      // Rx symbol + title
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold italic 30px Georgia, serif";
      ctx.fillText("℞", MX, y + 24);
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 14px Arial";
      ctx.fillText("Médicament prescrit", MX + 40, y + 20);
      y += 42;

      // Med card
      ctx.fillStyle = "#f0f7ff";
      roundRect(ctx, MX, y, MW, 90, 10);
      ctx.fill();
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 1.5;
      roundRect(ctx, MX, y, MW, 90, 10);
      ctx.stroke();
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(MX, y, 5, 90);
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 16px Arial";
      ctx.fillText(prescription.medicament, MX + 14, y + 28);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "8px Arial";
      ctx.fillText("POSOLOGIE / DOSAGE", MX + 14, y + 52);
      ctx.fillStyle = "#7c3aed";
      ctx.font = "8px Arial";
      ctx.fillText("DURÉE DU TRAITEMENT", MX + bw / 2 + 14, y + 52);
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 11px Arial";
      ctx.fillText(prescription.dosage, MX + 14, y + 68);
      ctx.fillText(prescription.duree, MX + bw / 2 + 14, y + 68);
      y += 106;

      // Instructions
      if (prescription.instructions) {
        ctx.fillStyle = "#fffbeb";
        roundRect(ctx, MX, y, MW, 60, 8);
        ctx.fill();
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 1.5;
        roundRect(ctx, MX, y, MW, 60, 8);
        ctx.stroke();
        ctx.fillStyle = "#92400e";
        ctx.font = "bold 8px Arial";
        ctx.fillText("INSTRUCTIONS PARTICULIÈRES", MX + 12, y + 18);
        ctx.fillStyle = "#78350f";
        ctx.font = "10px Arial";
        ctx.fillText(prescription.instructions, MX + 12, y + 36);
        y += 76;
      }

      // Signature
      y = H - 160;
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(MX, y); ctx.lineTo(W - 20, y); ctx.stroke();
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W - 210, y + 50); ctx.lineTo(W - 22, y + 50); ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.font = "9px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Signature et cachet", W - 116, y + 66);
      ctx.textAlign = "left";

      // Stamp circle
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.arc(MX + 40, H - 80, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // cercle cachet vide

      // Footer
      y = H - 30;
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 2]);
      ctx.beginPath(); ctx.moveTo(MX, H - 44); ctx.lineTo(W - 20, H - 44); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "8px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Assurance Santé Connect — Tél : +221 33 123 45 67", MX, y);
      ctx.textAlign = "right";
      ctx.fillText("Ordonnance valable 30 jours", W - 20, y);
      ctx.textAlign = "left";

      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ordonnance-${numero()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    const img = new Image();
    img.onload = () => doRender(img);
    img.onerror = () => doRender(null);
    img.src = "/logo.png";
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout title="Ordonnance">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !prescription) {
    return (
      <AppLayout title="Ordonnance introuvable" subHeader={
        <Button size="sm" onClick={() => navigate("/prescriptions")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux prescriptions
        </Button>
      }>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
          <FileText size={40} className="text-muted-foreground opacity-40" />
          <p className="font-semibold text-lg">Prescription introuvable</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Ordonnance ${numero()}`} subHeader={
      <Button size="sm" onClick={() => navigate("/prescriptions")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Boutons */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Imprimer
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Télécharger PNG
          </Button>
        </div>

        {/* Aperçu ordonnance */}
        <div className="rounded-2xl overflow-hidden shadow-xl border border-blue-100">
          {/* Wrapper flex */}
          <div className="flex min-h-[780px]">

            {/* Sidebar bleue */}
            <div className="w-52 shrink-0 bg-blue-600 text-white flex flex-col p-5 gap-4">
              {/* Logos entreprise + prestataire */}
              <div className="flex items-center gap-2 justify-center">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="bg-white rounded-lg p-1.5 w-14 h-14 flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="ASC" className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <p className="text-[9px] font-semibold text-center leading-tight opacity-90">Assurance<br/>Santé Connect</p>
                </div>
                <div className="w-px h-12 bg-white/30 shrink-0" />
                <div className="flex flex-col items-center gap-1 flex-1">
                  {prestLogo() ? (
                    <>
                      <div className="bg-white rounded-lg p-1.5 w-14 h-14 flex items-center justify-center overflow-hidden">
                        <img src={prestLogo()} alt={medecinNom()} className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                      <p className="text-[9px] font-semibold text-center leading-tight opacity-90">{medecinNom()}</p>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="font-bold text-xs leading-tight">{medecinNom()}</p>
                      {medecinSpec() && <p className="text-[9px] text-blue-200 mt-0.5">{medecinSpec()}</p>}
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-white/25" />

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold mb-0.5">Numéro</p>
                  <p className="font-bold font-mono">{numero()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold mb-0.5">Date d'émission</p>
                  <p className="font-semibold text-xs">{dateStr()}</p>
                </div>
                {prescription.consultation?.motif && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-blue-300 font-semibold mb-0.5">Motif</p>
                    <p className="text-xs text-blue-100">{prescription.consultation.motif}</p>
                  </div>
                )}
              </div>

              <div className="mt-auto bg-white/10 border border-white/25 rounded-xl p-3 text-center">
                <p className="font-bold text-xs mb-1">⏱ Validité</p>
                <p className="text-[10px] text-blue-100 leading-relaxed">
                  Ordonnance valable <strong className="text-white">30 jours</strong> à compter de la date d'émission
                </p>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="flex-1 bg-white p-6 flex flex-col">

              {/* En-tête */}
              <div className="flex items-start justify-between pb-4 mb-5 border-b-[3px] border-blue-600">
                <div>
                  <h1 className="text-3xl font-black text-blue-600 leading-tight">
                    ORDONNANCE<br />MÉDICALE
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    République du Sénégal — Ministère de la Santé et de l'Action Sociale
                  </p>
                </div>
                <div className="text-right bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                  <p className="font-black font-mono text-blue-700 text-base">{numero()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                    <Calendar size={11} />{dateStr()}
                  </p>
                </div>
              </div>

              {/* Patient / Médecin */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="border border-blue-200 border-l-[4px] border-l-blue-600 rounded-xl p-3 bg-blue-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Patient</p>
                  </div>
                  <p className="font-black text-base text-gray-900">{assureNom()}</p>
                  {patientTel() && <p className="text-xs text-blue-600 mt-0.5">{patientTel()}</p>}
                </div>
                <div className="border border-purple-200 border-l-[4px] border-l-purple-600 rounded-xl p-3 bg-purple-50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Dr</p>
                  </div>
                  <p className="font-black text-base text-gray-900">{medecinNom()}</p>
                  {medecinSpec() && <p className="text-xs text-purple-600 mt-0.5">{medecinSpec()}</p>}
                </div>
              </div>

              {/* Rx */}
              <div className="flex items-center gap-3 mb-3">
                <span className="font-serif text-4xl font-bold text-blue-600 leading-none">&#8478;</span>
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-base text-gray-900">Médicament prescrit</h3>
                </div>
              </div>

              {/* Médicament */}
              <div className="border-[1.5px] border-blue-300 border-l-[5px] border-l-blue-600 rounded-xl p-4 bg-blue-50/60 mb-4">
                <p className="font-black text-xl text-blue-700 mb-3">{prescription.medicament}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Posologie / Dosage</p>
                    <p className="font-bold text-sm text-gray-900">{prescription.dosage}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Durée du traitement</p>
                    <p className="font-bold text-sm text-gray-900">{prescription.duree}</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {prescription.instructions && (
                <div className="border border-amber-300 bg-amber-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Instructions particulières</p>
                  </div>
                  <p className="text-sm text-amber-900">{prescription.instructions}</p>
                </div>
              )}

              <div className="flex-1" />

              {/* Signature */}
              <div className="flex justify-between items-end pt-4 border-t border-gray-200 mt-4">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300" />
                <div className="text-right">
                  <div className="w-44 h-10 border-t-2 border-blue-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Signature et cachet</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  Assurance Santé Connect — Tél : +221 33 123 45 67
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock size={10} />
                  Valable 30 jours
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Helper pour canvas rounded rect
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
