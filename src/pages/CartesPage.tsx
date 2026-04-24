import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Download, QrCode, Loader2, ServerCrash, Users } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";

const BRAND = "#1B5299";
const GOLD  = "#D4A017";

const qrUrl = (num: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(num)}&bgcolor=ffffff&color=1B5299&margin=3`;

function fmt(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return "—"; }
}

// ─── Photo placeholder ────────────────────────────────────────────────────────
function PhotoBox({ src }: { src?: string }) {
  return (
    <div
      className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0"
      style={{ width: 72, height: 96, border: `2px solid ${BRAND}40` }}
    >
      {src
        ? <img src={src} alt="photo" className="w-full h-full object-cover" />
        : (
          <svg viewBox="0 0 24 24" fill="#CBD5E1" width="36" height="36">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        )
      }
    </div>
  );
}

// ─── Ligne de champ ───────────────────────────────────────────────────────────
function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex gap-1 leading-tight">
      <span className="text-[10px] text-gray-500 shrink-0 w-[88px]">{label} :</span>
      <span className={`text-[10px] font-semibold truncate ${green ? "text-green-600" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}

// ─── Carte ────────────────────────────────────────────────────────────────────
function InsuranceCard({ a }: { a: any }) {
  const type = String(a.type ?? "").toUpperCase();
  const isGroupe  = type === "GROUPE";
  const isFamille = type === "FAMILLE";
  const bens: string[] = Array.isArray(a.beneficiaires) ? a.beneficiaires.map(String) : [];
  const typeLabel = isGroupe ? "GROUPE" : isFamille ? "FAMILLE" : "INDIVIDUEL";

  return (
    <div className="rounded-2xl overflow-hidden bg-white w-full"
      style={{ boxShadow: "0 8px 32px rgba(27,82,153,0.22)", border: "1px solid #e5e7eb" }}>

      {/* ── Bande bleue haute ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: BRAND }}>
        <img src="/logo1.png" alt="PSA" className="h-9 object-contain shrink-0 drop-shadow"
          onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-xs sm:text-sm leading-tight tracking-wide truncate">
            PAPY SERVICES ASSURANCES
          </p>
          <p className="text-white/80 text-[10px] sm:text-[11px] font-medium">
            CARTE D'ASSURANCE SANTÉ
          </p>
        </div>
        <span className="text-[10px] font-bold text-white bg-white/20 rounded px-2 py-0.5 shrink-0 uppercase">
          {typeLabel}
        </span>
      </div>

      {/* ── Bande or (numéro) ─────────────────────────────────────── */}
      <div className="px-4 py-1.5 flex items-center"
        style={{ background: `linear-gradient(90deg, #B8860B, ${GOLD}, #B8860B)` }}>
        <span className="font-black text-white tracking-widest text-xs sm:text-sm font-mono drop-shadow">
          {a.numero ?? "PSA-0000-0000-0000"}
        </span>
      </div>

      {/* ── Corps ─────────────────────────────────────────────────── */}
      <div className="flex gap-3 px-4 py-3">

        {/* Gauche : puce + infos */}
        <div className="flex-1 min-w-0 flex flex-col gap-2.5">

          {/* Nom titulaire */}
          <div className="min-w-0">
            <p className="text-[9px] text-gray-400 uppercase font-medium">Titulaire</p>
            <p className="font-black text-gray-900 uppercase text-sm leading-tight truncate">
              {a.nom ?? "—"}
            </p>
            <p className="font-semibold text-gray-700 text-xs truncate">{a.prenom ?? ""}</p>
          </div>

          {/* Champs */}
          <div className="space-y-0.5">
            {!isGroupe && (
              <>
                <Row label="Sexe"     value={a.sexe ?? "—"} />
                <Row label="Né(e) le" value={fmt(a.dateNaissance)} />
                <Row label="Tél"      value={a.telephone ?? "—"} />
                <Row label="Garantie" value={a.garantie ?? "Standard"} />
              </>
            )}
            {isGroupe && (
              <>
                <Row label="Entreprise" value={a.nom ?? "—"} />
                <Row label="Secteur"    value={a.secteur ?? "—"} />
                <Row label="Employés"   value={String(a.employes ?? "—")} />
                <Row label="Assurés"    value={String(a.assures ?? (bens.length || "—"))} />
              </>
            )}
            <Row label="Statut"        value={a.statut ?? "—"}  green />
            <Row label="Valide jusqu'" value={a.dateFin ? fmt(a.dateFin) : "31/12/2026"} />
          </div>

          {/* Bénéficiaires */}
          {isFamille && bens.length > 0 && (
            <div className="pt-1.5 border-t border-gray-100">
              <p className="text-[9px] text-gray-400 uppercase font-medium mb-1">Bénéficiaires</p>
              <div className="flex flex-wrap gap-1">
                {bens.slice(0, 5).map((b, i) => (
                  <span key={i} className="text-[9px] font-semibold rounded px-1.5 py-0.5"
                    style={{ background: `${BRAND}18`, color: BRAND }}>
                    {b}
                  </span>
                ))}
                {bens.length > 5 && (
                  <span className="text-[9px] text-gray-400">+{bens.length - 5}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Droite : photo + QR */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <PhotoBox src={a.photo} />
          <div className="rounded border border-gray-200 bg-white p-0.5"
            style={{ width: 72 }}>
            <img src={qrUrl(a.numero ?? "PSA")} alt="QR" width={70} height={70}
              crossOrigin="anonymous" />
          </div>
        </div>
      </div>

      {/* ── Pied ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t"
        style={{ background: `${BRAND}08`, borderColor: `${BRAND}18` }}>
        <span className="text-[9px] text-gray-400">
          Délivrée le {new Date().toLocaleDateString("fr-FR")}
        </span>
        <span className="text-[9px] font-semibold" style={{ color: BRAND }}>
          papyservicesassurances.sn
        </span>
        <span className="text-[9px] text-gray-400 italic">Le Directeur Général</span>
      </div>
    </div>
  );
}

// ─── Téléchargement canvas ────────────────────────────────────────────────────
async function downloadCard(a: any) {
  const W = 900, H = 560;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const bens: string[] = Array.isArray(a.beneficiaires) ? a.beneficiaires.map(String) : [];
  const isGroupe  = String(a.type ?? "").toUpperCase() === "GROUPE";
  const isFamille = String(a.type ?? "").toUpperCase() === "FAMILLE";
  const typeLabel = isGroupe ? "GROUPE" : isFamille ? "FAMILLE" : "INDIVIDUEL";

  const loadImg = (src: string) => new Promise<HTMLImageElement | null>(res => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => res(img); img.onerror = () => res(null); img.src = src;
  });

  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  };

  // Fond blanc + arrondi
  ctx.fillStyle = "#fff"; rr(0, 0, W, H, 24); ctx.fill();

  // Filigrane
  ctx.save(); ctx.globalAlpha = 0.035; ctx.fillStyle = BRAND;
  ctx.font = "bold 220px Arial"; ctx.textAlign = "center";
  ctx.fillText("PSA", W/2, H/2+80); ctx.restore();

  // Bande bleue
  ctx.fillStyle = BRAND; ctx.fillRect(0, 0, W, 140);

  // Logo
  const logo = await loadImg("/logo1.png");
  if (logo) ctx.drawImage(logo, 24, 16, 100, 100);

  // Textes entête
  ctx.fillStyle = "#fff"; ctx.textAlign = "left";
  ctx.font = "bold 24px Arial"; ctx.fillText("PAPY SERVICES ASSURANCES", 138, 64);
  ctx.font = "15px Arial"; ctx.globalAlpha = 0.85;
  ctx.fillText("CARTE D'ASSURANCE SANTÉ", 138, 86); ctx.globalAlpha = 1;

  // Badge type
  ctx.fillStyle = "rgba(255,255,255,0.22)"; rr(W-120, 22, 100, 26, 5); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center";
  ctx.fillText(typeLabel, W-70, 39); ctx.textAlign = "left";

  // Bande or
  const g = ctx.createLinearGradient(0,0,W,0);
  g.addColorStop(0,"#B8860B"); g.addColorStop(0.5,GOLD); g.addColorStop(1,"#B8860B");
  ctx.fillStyle = g; ctx.fillRect(0, 140, W, 50);
  ctx.fillStyle = "#fff"; ctx.font = "bold 26px monospace";
  ctx.fillText(a.numero ?? "PSA-0000-0000-0000", 32, 175);

  // Puce (dessin simple)
  const cx=32, cy=220, cw=58, ch=44;
  ctx.fillStyle = GOLD; rr(cx, cy, cw, ch, 5); ctx.fill();
  ctx.fillStyle="#C49A10"; ctx.fillRect(cx+16,cy,18,ch); ctx.fillRect(cx,cy+14,cw,16);
  ctx.fillStyle=GOLD; rr(cx+18,cy+16,16,10,2); ctx.fill();

  // Photo
  const px = W-165, py = 200, pw = 120, ph = 160;
  ctx.fillStyle = "#E5E7EB"; rr(px, py, pw, ph, 6); ctx.fill();
  if (a.photo) {
    const pImg = await loadImg(a.photo);
    if (pImg) {
      ctx.save(); rr(px, py, pw, ph, 6); ctx.clip();
      ctx.drawImage(pImg, px, py, pw, ph); ctx.restore();
    }
  }
  ctx.strokeStyle = `${BRAND}55`; ctx.lineWidth = 1.5;
  rr(px, py, pw, ph, 6); ctx.stroke();

  // Champs texte
  const rows = isGroupe
    ? [["Entreprise", a.nom??"-"], ["Secteur", a.secteur??"-"], ["Employés", String(a.employes??"-")], ["Assurés", String(a.assures??"-")]]
    : [["Nom", a.nom??"-"], ["Prénoms", a.prenom??"-"], ["Sexe", a.sexe??"-"], ["Né(e) le", fmt(a.dateNaissance)]];
  const rows2 = [["Téléphone", a.telephone??"-"], ["Garantie", a.garantie??"Standard"], ["Statut", a.statut??"-"], ["Valide", a.dateFin?fmt(a.dateFin):"31/12/2026"]];

  let ry = 226;
  [[cx+70, rows], [340, rows2]].forEach(([xp, rs]) => {
    let y2 = ry;
    (rs as string[][]).forEach(([l, v]) => {
      ctx.fillStyle="#9CA3AF"; ctx.font="10px Arial"; ctx.textAlign="left";
      ctx.fillText(l.toUpperCase(), xp as number, y2);
      ctx.fillStyle = l==="Statut" ? "#059669" : "#111827";
      ctx.font="bold 14px Arial";
      ctx.fillText(String(v).substring(0,26), xp as number, y2+16); y2+=38;
    });
  });

  if (bens.length > 0) {
    ctx.fillStyle="#9CA3AF"; ctx.font="10px Arial";
    ctx.fillText("BÉNÉFICIAIRES", cx+70, 415);
    ctx.fillStyle=BRAND; ctx.font="bold 12px Arial";
    ctx.fillText(bens.slice(0,5).join("  ·  ").substring(0,55), cx+70, 432);
  }

  // QR
  const qr = await loadImg(qrUrl(a.numero??"PSA"));
  if (qr) {
    const qs = pw;
    ctx.fillStyle="#fff"; rr(px, py+ph+10, qs, qs, 5); ctx.fill();
    ctx.strokeStyle="#E5E7EB"; ctx.lineWidth=1; rr(px, py+ph+10, qs, qs, 5); ctx.stroke();
    ctx.drawImage(qr, px+3, py+ph+13, qs-6, qs-6);
  }

  // Pied
  ctx.fillStyle=`${BRAND}0C`; ctx.fillRect(0, H-36, W, 36);
  ctx.strokeStyle=`${BRAND}20`; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,H-36); ctx.lineTo(W,H-36); ctx.stroke();
  ctx.fillStyle="#9CA3AF"; ctx.font="10px Arial"; ctx.textAlign="left";
  ctx.fillText(`Délivrée le ${new Date().toLocaleDateString("fr-FR")}`, 24, H-12);
  ctx.fillStyle=BRAND; ctx.textAlign="center";
  ctx.fillText("www.papyservicesassurances.sn", W/2, H-12);
  ctx.fillStyle="#9CA3AF"; ctx.textAlign="right";
  ctx.fillText("Le Directeur Général", W-24, H-12);

  // Clip arrondi final
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = "#000"; rr(0,0,W,H,24); ctx.fill();

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `carte-psa-${a.numero??"assurance"}.png`; link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CartesPage() {
  const { user } = useAuth();
  const isClient = user?.role === "client";

  const [search,  setSearch]  = useState("");
  const [assures, setAssures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    DataService.getAssures()
      .then(list => {
        const all = Array.isArray(list) ? list : [];
        setAssures(isClient ? all.filter((a: any) => a.email === user?.email) : all);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isClient, user?.email]);

  const filtered = assures.filter(a =>
    [a.nom, a.prenom, a.numero].some(v =>
      String(v ?? "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const pageTitle = isClient ? "Ma Carte d'assurance" : "Cartes d'assurance";

  if (loading) return (
    <AppLayout title={pageTitle}>
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: BRAND }} />
        <span className="text-sm text-muted-foreground">Chargement des cartes…</span>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout title={pageTitle}>
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <ServerCrash className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="font-semibold">Impossible de joindre le serveur</p>
        <p className="text-sm text-muted-foreground">Vérifiez que le backend est démarré.</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title={pageTitle}>
      <div className="space-y-5">

        {!isClient && (
          <div className="flex items-center gap-2 max-w-sm">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border bg-card text-sm">
              <Search size={14} className="text-muted-foreground shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un assuré…"
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 text-sm" />
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center text-muted-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 opacity-30">
              <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
            </svg>
            <p className="font-semibold text-foreground">
              {search ? "Aucun assuré trouvé"
                : isClient ? "Aucune carte pour votre compte"
                : "Aucun assuré enregistré"}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((a, i) => (
            <motion.div key={a.id ?? i}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="space-y-2"
            >
              <InsuranceCard a={a} />

              <div className="flex items-center gap-2 px-1">
                {Array.isArray(a.beneficiaires) && a.beneficiaires.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={12} />
                    {a.beneficiaires.length} bénéficiaire{a.beneficiaires.length > 1 ? "s" : ""}
                  </span>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => downloadCard(a)}>
                    <Download size={13} /> Télécharger
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                    onClick={() => window.open(qrUrl(a.numero ?? "PSA"), "_blank")}>
                    <QrCode size={13} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </AppLayout>
  );
}
