import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Download, QrCode, CreditCard, User, Loader2, ServerCrash } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataService } from "@/services/dataService";
import { useAuth } from "@/context/AuthContext";

export default function CartesPage() {
  const { user } = useAuth();
  const isClient = user?.role === "client";

  const [search, setSearch] = useState("");
  const [assures, setAssures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    DataService.getAssures()
      .then(list => {
        const all = list ?? [];
        // A01 — Broken Access Control : un client ne voit que sa propre carte
        if (isClient) {
          setAssures(all.filter((a: any) => a.email === user?.email));
        } else {
          setAssures(all);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isClient, user?.email]);

  const filtered = assures.filter(
    (a) =>
      (a.nom ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.prenom ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.numero ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const generateQRCode = (numero: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${numero}`;

  const downloadCard = (assure: any) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 0, 1000, 630);

    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(850, 100, 200, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(150, 500, 150, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(20, 20, 960, 590, 30); ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial"; ctx.fillText("RÉPUBLIQUE DU SÉNÉGAL", 60, 80);
    ctx.font = "16px Arial"; ctx.globalAlpha = 0.9;
    ctx.fillText("Ministère de la Santé et de l'Action Sociale", 60, 105);
    ctx.globalAlpha = 1;
    ctx.font = "bold 48px Arial"; ctx.fillText("Papy Services Assurances", 60, 170);
    ctx.font = "22px Arial"; ctx.globalAlpha = 0.9;
    ctx.fillText("CARTE D'ASSURANCE SANTÉ", 60, 200);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(60, 230); ctx.lineTo(940, 230); ctx.stroke();

    ctx.font = "18px Arial"; ctx.globalAlpha = 0.8;
    ctx.fillText("TITULAIRE DE LA CARTE", 60, 280);
    ctx.globalAlpha = 1;
    ctx.font = "bold 42px Arial";
    ctx.fillText(`${assure.nom.toUpperCase()} ${assure.prenom}`, 60, 330);
    ctx.font = "16px Arial"; ctx.globalAlpha = 0.8;
    ctx.fillText("N° D'ASSURÉ", 60, 380);
    ctx.globalAlpha = 1;
    ctx.font = "bold 32px monospace"; ctx.fillText(assure.numero, 60, 415);
    ctx.font = "18px Arial";
    ctx.fillText(`Type : ${assure.type.toUpperCase()}`, 60, 470);
    ctx.fillText(`Statut : ${assure.statut}`, 60, 505);
    ctx.fillText(`Tél : ${assure.telephone}`, 60, 540);
    ctx.font = "16px Arial"; ctx.globalAlpha = 0.8;
    ctx.fillText("Valide jusqu'au : 31/12/2026", 60, 580);
    ctx.globalAlpha = 1;

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.onload = () => {
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
      ctx.beginPath(); ctx.roundRect(750, 250, 200, 200, 15); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.drawImage(qrImg, 765, 265, 170, 170);
      ctx.fillStyle = "white"; ctx.font = "bold 14px Arial";
      ctx.textAlign = "center"; ctx.fillText("SCANNEZ-MOI", 850, 480);
      ctx.textAlign = "left";
      ctx.fillRect(880, 60, 40, 15); ctx.fillRect(887, 53, 26, 29);
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `carte-assurance-${assure.numero}.png`; a.click();
          URL.revokeObjectURL(url);
        }
      });
    };
    qrImg.src = generateQRCode(assure.numero);
  };

  const pageTitle = isClient ? "Ma Carte d'assurance" : "Cartes d'assurance";

  if (loading) return (
    <AppLayout title={pageTitle}>
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-sm text-muted-foreground">Chargement des cartes...</span>
      </div>
    </AppLayout>
  );

  if (error) return (
    <AppLayout title={pageTitle}>
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
        <ServerCrash className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="font-semibold">Impossible de joindre le serveur</p>
        <p className="text-sm text-muted-foreground">Service temporairement indisponible</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title={pageTitle}>
      <div className="space-y-4">

        {/* ── Barre de recherche (admin/prestataire uniquement) ──────── */}
        {!isClient && (
          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-input bg-card text-sm">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un assuré..."
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
              />
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
            <CreditCard size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold">
              {search
                ? "Aucun assuré trouvé"
                : isClient
                  ? "Aucune carte trouvée pour votre compte"
                  : "Aucun assuré enregistré"}
            </p>
            {!search && isClient && (
              <p className="text-sm text-muted-foreground max-w-xs">
                Votre adresse e-mail doit correspondre à celle de votre dossier assuré. Contactez l'administrateur si vous pensez qu'il y a une erreur.
              </p>
            )}
          </div>
        )}

        {/* ── Grille de cartes ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((assure, i) => (
            <motion.div
              key={assure.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="overflow-hidden hover:shadow-xl transition-shadow">

                {/* ── Face de la carte ───────────────────────────────── */}
                <div className="relative h-44 sm:h-48 bg-blue-600 p-4 sm:p-5 text-white overflow-hidden">

                  {/* Cercles décoratifs */}
                  <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

                  {/* En-tête */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium opacity-80 uppercase tracking-wider">Assurance Santé</p>
                      <p className="text-sm sm:text-base font-bold mt-0.5">Papy Services</p>
                    </div>
                    <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 opacity-70" />
                  </div>

                  {/* QR code */}
                  <div className="absolute top-3 right-12 sm:right-14 w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg p-0.5 shadow-lg">
                    <img
                      src={generateQRCode(assure.numero)}
                      alt="QR"
                      className="w-full h-full object-cover rounded"
                    />
                  </div>

                  {/* Infos assuré */}
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <p className="text-[10px] sm:text-xs opacity-70 mb-0.5">Assuré(e)</p>
                    <p className="text-sm sm:text-lg font-bold truncate pr-2">{assure.nom} {assure.prenom}</p>
                    <p className="text-[10px] sm:text-xs font-mono mt-1 opacity-80 tracking-widest truncate">{assure.numero}</p>
                  </div>
                </div>

                {/* ── Infos bas de carte ─────────────────────────────── */}
                <div className="p-3 sm:p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs sm:text-sm capitalize">{assure.type || "—"}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      assure.statut === "Actif" || assure.statut === "ACTIF"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {assure.statut}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-1 border-t">
                    <Button
                      onClick={() => downloadCard(assure)}
                      className="flex-1 h-8 text-xs"
                      size="sm"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Télécharger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      title="Voir QR code"
                      onClick={() => window.open(generateQRCode(assure.numero), "_blank")}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
