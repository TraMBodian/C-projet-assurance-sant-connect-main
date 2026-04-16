import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pill, User, FileText, Download, Printer, Loader2, Building2, Calendar } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  // ── Helpers ──────────────────────────────────────────────────────────────
  const assureNom = () => {
    const a = prescription?.consultation?.assure;
    return a ? `${a.nom} ${a.prenom}` : "—";
  };

  const medecinNom = () => {
    const p = prescription?.consultation?.prestataire;
    return p ? p.nom : "—";
  };

  const dateStr = () => {
    const d = prescription?.consultation?.dateConsultation || prescription?.createdAt;
    return d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—";
  };

  const numero = () => `ORD-${String(prescription?.id ?? "???").padStart(4, "0")}`;

  // ── Impression ───────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!prescription) return;
    const win = window.open("", "", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Ordonnance ${numero()}</title>
      <style>
        @page { margin: 1.5cm; size: A4; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; }
        .wrap { border: 2px solid #000; padding: 20px; min-height: 26cm; display: flex; flex-direction: column; }
        .head { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
        .head h1 { font-size: 18pt; font-weight: bold; }
        .head p  { font-size: 10pt; margin-top: 4px; }
        .row  { display: flex; justify-content: space-between; margin-bottom: 16px; }
        .col  { flex: 1; }
        .label { font-weight: bold; text-decoration: underline; }
        .rx { font-size: 28pt; font-weight: bold; text-align: center; margin: 12px 0; font-family: serif; }
        .med { margin: 10px 0 10px 20px; }
        .med-name { font-weight: bold; font-size: 13pt; }
        .med-detail { margin-left: 20px; margin-top: 4px; }
        .box { border: 1px solid #000; padding: 8px; margin: 12px 0; min-height: 50px; }
        .sign { margin-top: auto; padding-top: 20px; text-align: right; }
        .sign-line { width: 200px; border-top: 1px solid #000; margin: 28px 0 4px auto; text-align: center; }
        .foot { margin-top: 12px; text-align: center; font-size: 9pt; border-top: 1px solid #000; padding-top: 8px; }
      </style></head><body>
      <div class="wrap">
        <div class="head">
          <h1>ORDONNANCE MÉDICALE</h1>
          <p>République du Sénégal — Ministère de la Santé et de l'Action Sociale</p>
        </div>
        <div class="row">
          <div class="col"><p><span class="label">N° :</span> ${numero()}</p><p><span class="label">Date :</span> ${dateStr()}</p></div>
          <div class="col" style="text-align:right"><p><span class="label">Médecin :</span> ${medecinNom()}</p></div>
        </div>
        <div class="row">
          <div class="col"><p><span class="label">Patient :</span> ${assureNom()}</p></div>
        </div>
        <div class="rx">&#8478;</div>
        <div class="med">
          <div class="med-name">${prescription.medicament}</div>
          <div class="med-detail">
            <p>Posologie : ${prescription.dosage}</p>
            <p>Durée : ${prescription.duree}</p>
          </div>
        </div>
        ${prescription.instructions ? `<div class="box"><strong>Recommandations :</strong><br>${prescription.instructions}</div>` : ""}
        <div class="sign"><div class="sign-line">Signature et cachet</div></div>
        <div class="foot">Ordonnance valable 30 jours — Papy Services Assurances — Tél : +221 33 123 45 67</div>
      </div></body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  // ── Download PNG ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!prescription) return;
    const canvas = document.createElement("canvas");
    canvas.width  = 794;
    canvas.height = 1050;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 794, 1050);

    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(0, 0, 794, 110);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 26px Arial";
    ctx.fillText("ORDONNANCE MÉDICALE", 40, 50);
    ctx.font = "15px Arial";
    ctx.fillText("République du Sénégal — Ministère de la Santé", 40, 82);

    ctx.fillStyle = "#000";
    let y = 140;
    const line = (txt: string, bold = false) => {
      ctx.font = (bold ? "bold " : "") + "14px Arial";
      ctx.fillText(txt, 40, y);
      y += 24;
    };

    line(`N° : ${numero()}  |  Date : ${dateStr()}`, true);
    line(`Patient : ${assureNom()}`, true);
    line(`Médecin : ${medecinNom()}`);
    y += 10;

    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(754, y); ctx.stroke();
    y += 20;

    ctx.font = "bold 20px serif";
    ctx.fillText("Rx", 40, y); y += 30;

    ctx.font = "bold 15px Arial";
    ctx.fillText(prescription.medicament, 60, y); y += 26;
    ctx.font = "14px Arial";
    ctx.fillText(`  Posologie : ${prescription.dosage}`, 60, y); y += 22;
    ctx.fillText(`  Durée : ${prescription.duree}`, 60, y); y += 30;

    if (prescription.instructions) {
      ctx.font = "bold 14px Arial";
      ctx.fillText("Instructions :", 40, y); y += 22;
      ctx.font = "13px Arial";
      ctx.fillText(prescription.instructions, 40, y); y += 30;
    }

    y = 970;
    ctx.strokeStyle = "#1d4ed8";
    ctx.beginPath(); ctx.moveTo(500, y); ctx.lineTo(750, y); ctx.stroke();
    ctx.font = "12px Arial";
    ctx.fillStyle = "#555";
    ctx.fillText("Signature et cachet du médecin", 520, y + 18);

    ctx.font = "10px Arial";
    ctx.fillStyle = "#888";
    ctx.fillText("Ordonnance valable 30 jours — Papy Services Assurances", 40, 1020);

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

        {/* Actions */}
        <div className="flex items-center justify-end flex-wrap gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Imprimer
            </Button>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Télécharger
            </Button>
          </div>
        </div>

        {/* Card principale */}
        <Card className="p-6 sm:p-8">

          {/* En-tête */}
          <div className="border-b pb-6 mb-6 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Ordonnance Médicale</h2>
              <p className="text-muted-foreground text-sm mt-1">République du Sénégal — Ministère de la Santé</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-lg">{numero()}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end mt-1">
                <Calendar size={13} />{dateStr()}
              </p>
            </div>
          </div>

          {/* Patient / Médecin */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <p className="font-semibold text-blue-900 text-sm">Patient</p>
              </div>
              <p className="font-bold text-base">{assureNom()}</p>
              {prescription.consultation?.assure?.telephone && (
                <p className="text-xs text-blue-700 mt-1">{prescription.consultation.assure.telephone}</p>
              )}
            </Card>

            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <p className="font-semibold text-purple-900 text-sm">Médecin prescripteur</p>
              </div>
              <p className="font-bold text-base">{medecinNom()}</p>
              {prescription.consultation?.prestataire?.specialite && (
                <p className="text-xs text-purple-700 mt-1">{prescription.consultation.prestataire.specialite}</p>
              )}
            </Card>
          </div>

          {/* Rx symbol */}
          <div className="flex items-center gap-3 mb-4">
            <Pill className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold">Médicament prescrit</h3>
          </div>

          <Card className="p-5 border-l-4 border-l-blue-600 mb-6">
            <p className="font-bold text-lg mb-3">{prescription.medicament}</p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground mb-0.5">Posologie</p>
                <p className="font-medium">{prescription.dosage}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Durée du traitement</p>
                <p className="font-medium">{prescription.duree}</p>
              </div>
            </div>
          </Card>

          {/* Instructions */}
          {prescription.instructions && (
            <Card className="p-4 bg-yellow-50 border-yellow-200 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-yellow-700" />
                <p className="font-semibold text-yellow-900 text-sm">Instructions particulières</p>
              </div>
              <p className="text-sm">{prescription.instructions}</p>
            </Card>
          )}

          {/* Signature + motif consultation */}
          {prescription.consultation?.motif && (
            <div className="border-t pt-4 mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Motif de consultation :</span> {prescription.consultation.motif}
              </p>
            </div>
          )}

          <div className="border-t pt-6 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">Signature et cachet du médecin</p>
              <div className="w-48 h-12 border-t-2 border-blue-600" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>Cette ordonnance est valable 30 jours à compter de la date d'émission</p>
            <p className="mt-0.5">Papy Services Assurances — Tél : +221 33 123 45 67</p>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
