import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Stethoscope, Pill, Loader2, AlertCircle, Printer, Download, Archive } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { DataService } from "@/services/dataService";

type Tab = "consultations" | "prescriptions";

function printDocument(title: string, content: string) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  w.document.write(`
    <!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
      h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
      .row { display: flex; gap: 24px; margin-bottom: 8px; }
      .label { font-weight: 600; min-width: 140px; color: #555; }
      .section { margin-top: 24px; }
      .section-title { font-weight: 700; font-size: 15px; margin-bottom: 8px; color: #2563eb; }
      @media print { button { display: none; } }
    </style>
    </head><body>
    <h1>${title}</h1>
    ${content}
    <br/><button onclick="window.print()">Imprimer</button>
    </body></html>
  `);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

function consultationContent(c: any): string {
  const assure = c.assure ? `${c.assure.nom ?? ""} ${c.assure.prenom ?? ""}`.trim() : c.assureNom ?? "—";
  const medecin = c.prestataire?.nom ?? c.medecinNom ?? "—";
  return `
    <div class="section">
      <div class="row"><span class="label">Assuré :</span><span>${assure}</span></div>
      <div class="row"><span class="label">Médecin :</span><span>${medecin}</span></div>
      <div class="row"><span class="label">Spécialité :</span><span>${c.specialite ?? "—"}</span></div>
      <div class="row"><span class="label">Date :</span><span>${c.date ?? "—"}</span></div>
      <div class="row"><span class="label">Heure :</span><span>${c.heure ?? "—"}</span></div>
      <div class="row"><span class="label">Motif :</span><span>${c.motif ?? "—"}</span></div>
      ${c.notes ? `<div class="row"><span class="label">Notes :</span><span>${c.notes}</span></div>` : ""}
    </div>`;
}

function prescriptionContent(p: any): string {
  const assure = p.consultation?.assure
    ? `${p.consultation.assure.nom ?? ""} ${p.consultation.assure.prenom ?? ""}`.trim()
    : p.assureNom ?? "—";
  const medecin = p.consultation?.prestataire?.nom ?? p.medecinNom ?? "—";
  const meds = Array.isArray(p.medicaments)
    ? p.medicaments.map((m: any) => `<li>${m.nom ?? m} ${m.dosage ? `— ${m.dosage}` : ""} ${m.duree ? `(${m.duree})` : ""}</li>`).join("")
    : p.medicament ? `<li>${p.medicament}</li>` : "";
  return `
    <div class="section">
      <div class="row"><span class="label">Assuré :</span><span>${assure}</span></div>
      <div class="row"><span class="label">Médecin :</span><span>${medecin}</span></div>
      <div class="row"><span class="label">Date :</span><span>${p.date ?? p.consultation?.date ?? "—"}</span></div>
      ${p.instructions ? `<div class="row"><span class="label">Instructions :</span><span>${p.instructions}</span></div>` : ""}
    </div>
    ${meds ? `<div class="section"><div class="section-title">Médicaments</div><ul>${meds}</ul></div>` : ""}`;
}

export default function ArchivePage() {
  const [tab, setTab] = useState<Tab>("consultations");
  const [search, setSearch] = useState("");
  const [consultations, setConsultations] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([DataService.getConsultations(), DataService.getPrescriptions()])
      .then(([c, p]) => {
        setConsultations(c ?? []);
        setPrescriptions(p ?? []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const q = search.toLowerCase();

  const filteredConsultations = consultations.filter((c) => {
    const assure = c.assure ? `${c.assure.nom ?? ""} ${c.assure.prenom ?? ""}` : c.assureNom ?? "";
    return (
      assure.toLowerCase().includes(q) ||
      (c.specialite ?? "").toLowerCase().includes(q) ||
      (c.motif ?? "").toLowerCase().includes(q) ||
      (c.prestataire?.nom ?? c.medecinNom ?? "").toLowerCase().includes(q)
    );
  });

  const filteredPrescriptions = prescriptions.filter((p) => {
    const assure = p.consultation?.assure
      ? `${p.consultation.assure.nom ?? ""} ${p.consultation.assure.prenom ?? ""}`
      : p.assureNom ?? "";
    return (
      assure.toLowerCase().includes(q) ||
      (p.medicament ?? "").toLowerCase().includes(q) ||
      (p.consultation?.prestataire?.nom ?? p.medecinNom ?? "").toLowerCase().includes(q)
    );
  });

  const current = tab === "consultations" ? filteredConsultations : filteredPrescriptions;

  return (
    <AppLayout title="Archives médicales">
      <div className="space-y-5">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shrink-0">
            <Archive size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-base">Archives médicales</h2>
            <p className="text-xs text-muted-foreground">Consultations et ordonnances archivées — impression / PDF</p>
          </div>
        </div>

        {/* ── Tabs + Search ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            {(["consultations", "prescriptions"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "consultations" ? <Stethoscope size={14} /> : <Pill size={14} />}
                {t === "consultations" ? "Consultations" : "Ordonnances"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-card sm:w-72">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-sm min-w-0"
            />
          </div>
        </div>

        {/* ── Compteur ────────────────────────────────────────────────── */}
        {!loading && !error && (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{current.length}</span>{" "}
            {tab === "consultations" ? `consultation${current.length !== 1 ? "s" : ""}` : `ordonnance${current.length !== 1 ? "s" : ""}`}
            {search ? ` trouvée${current.length !== 1 ? "s" : ""}` : " archivée" + (current.length !== 1 ? "s" : "")}
          </p>
        )}

        {/* ── États ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-muted-foreground">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Chargement des archives...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <AlertCircle size={36} className="text-destructive opacity-60" />
            <p className="font-medium text-sm">Impossible de charger les archives</p>
          </div>
        ) : current.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
            <FileText size={40} className="text-muted-foreground opacity-30" />
            <p className="font-semibold">{search ? "Aucun résultat trouvé" : "Aucune archive disponible"}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
            >
              {tab === "consultations"
                ? filteredConsultations.map((c, i) => {
                    const assure = c.assure
                      ? `${c.assure.nom ?? ""} ${c.assure.prenom ?? ""}`.trim()
                      : c.assureNom ?? "Assuré inconnu";
                    const medecin = c.prestataire?.nom ?? c.medecinNom ?? "—";
                    return (
                      <motion.div
                        key={c.id ?? i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-card rounded-xl p-4 border border-border hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <Stethoscope size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{assure}</p>
                              <p className="text-xs text-muted-foreground truncate">{medecin}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{c.date ?? "—"}</span>
                        </div>
                        {c.specialite && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium mb-2">
                            {c.specialite}
                          </span>
                        )}
                        {c.motif && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{c.motif}</p>}
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <button
                            onClick={() => printDocument("Consultation médicale", consultationContent(c))}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <Printer size={12} />
                            Imprimer
                          </button>
                          <button
                            onClick={() => printDocument("Consultation médicale", consultationContent(c))}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Download size={12} />
                            PDF
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                : filteredPrescriptions.map((p, i) => {
                    const assure = p.consultation?.assure
                      ? `${p.consultation.assure.nom ?? ""} ${p.consultation.assure.prenom ?? ""}`.trim()
                      : p.assureNom ?? "Assuré inconnu";
                    const medecin = p.consultation?.prestataire?.nom ?? p.medecinNom ?? "—";
                    const nbMeds = Array.isArray(p.medicaments) ? p.medicaments.length : p.medicament ? 1 : 0;
                    return (
                      <motion.div
                        key={p.id ?? i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-card rounded-xl p-4 border border-border hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                              <Pill size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{assure}</p>
                              <p className="text-xs text-muted-foreground truncate">{medecin}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{p.date ?? p.consultation?.date ?? "—"}</span>
                        </div>
                        {nbMeds > 0 && (
                          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium mb-2">
                            {nbMeds} médicament{nbMeds !== 1 ? "s" : ""}
                          </span>
                        )}
                        {p.instructions && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.instructions}</p>}
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <button
                            onClick={() => printDocument("Ordonnance médicale", prescriptionContent(p))}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <Printer size={12} />
                            Imprimer
                          </button>
                          <button
                            onClick={() => printDocument("Ordonnance médicale", prescriptionContent(p))}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <Download size={12} />
                            PDF
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </AppLayout>
  );
}
