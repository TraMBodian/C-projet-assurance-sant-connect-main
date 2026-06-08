import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, X } from "@/components/ui/Icons";
import type { MembreFamille } from "../nouvelle-proposition/types";

// ─── Ordinals ─────────────────────────────────────────────────────────────────

const ORDINALS = ["1er","2e","3e","4e","5e","6e","7e","8e","9e","10e","11e"];

function roleLabel(role: string): string {
  if (role === "principal")  return "Assuré principal";
  if (role === "conjoint1")  return "1er conjoint";
  if (role === "conjoint2")  return "2e conjoint";
  const m = role.match(/^enfant(\d+)$/);
  if (m) {
    const n = Number(m[1]);
    return `${ORDINALS[n - 1] ?? `${n}e`} enfant`;
  }
  return role;
}

// ─── Questions ────────────────────────────────────────────────────────────────

const QUESTIONS = [
  { num: "1",  text: "Service militaire accompli" },
  { num: "2",  text: "Réformé ou exempté — causes organiques graves ayant entraîné une hospitalisation ou intervention chirurgicale" },
  { num: "3",  text: "Êtes-vous blessé de guerre ?" },
  { num: "4",  text: "Pensionné ? Taux de pension — Souffrez-vous d'une affection ?" },
  { num: "5",  text: "Donnez les précisions" },
  { num: "6",  text: "Avez-vous été atteint au cours des 10 dernières années de maladies ou troubles organiques graves ayant entraîné une hospitalisation ou intervention chirurgicale ?" },
  { num: "7",  text: "Avez-vous été victime d'un accident avec séquelles ?" },
  { num: "8",  text: "Souffrez-vous d'un défaut de constitution, d'une maladie ou infirmité d'origine congénitale ?" },
  { num: "9",  text: "Suivez-vous actuellement un régime, un traitement ? Préciser la nature" },
  { num: "10", text: "Avez-vous une bonne vue ?" },
  { num: "11", text: "Utilisez-vous des verres correcteurs ?" },
  { num: "12", text: "Êtes-vous actuellement l'objet de soins dentaires ?" },
  { num: "13", text: "Portez-vous une prothèse dentaire ?" },
  { num: "14", text: "Avez-vous des dents manquantes non remplacées par un appareil ?" },
  { num: "15", text: "Êtes-vous atteint d'une déficience auditive ?" },
  { num: "16", text: "Êtes-vous enceinte ? Date probable de l'accouchement. Vos précédentes maternités se sont-elles déroulées normalement ?" },
  { num: "17", text: "Un traitement de stérilité est-il en cours ou à prévoir ?" },
  { num: "18", text: "Votre état nécessite-il périodiquement un séjour dans un centre de soins (cure, rééducation ou réadaptation fonctionnelle) ?" },
  { num: "19", text: "Avez-vous subi un examen H.I.V. ?" },
  { num: "20", text: "Avez-vous à signaler des cas particuliers autres que ceux signalés ?" },
  { num: "21", text: "Êtes-vous asthmatique ?" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  answers:        Record<string, string>;
  membresFamille: MembreFamille[];
  onChange:       (answers: Record<string, string>, membresFamille: MembreFamille[]) => void;
  onContinue:     () => void;
  onBack?:        () => void;
  embedded?:      boolean;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function QuestionnaireStep({
  answers, membresFamille, onChange, onContinue, onBack, embedded,
}: Props) {
  const navigate = useNavigate();

  // Initialise avec le principal si la liste est vide
  useEffect(() => {
    if (membresFamille.length === 0) {
      onChange(answers, [{ role: "principal", nom: "", prenom: "", dateNaissance: "" }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const membres: MembreFamille[] = membresFamille.length > 0
    ? membresFamille
    : [{ role: "principal", nom: "", prenom: "", dateNaissance: "" }];

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const updateMembre = (index: number, field: keyof MembreFamille, value: string) => {
    const updated = [...membres];
    updated[index] = { ...updated[index], [field]: value };
    onChange(answers, updated);
  };

  const addConjoint = () => {
    const nb = membres.filter(m => m.role.startsWith("conjoint")).length;
    if (nb >= 2) return;
    const newRole = `conjoint${nb + 1}` as MembreFamille["role"];
    onChange(answers, [...membres, { role: newRole, nom: "", prenom: "", dateNaissance: "" }]);
  };

  const addEnfant = () => {
    const nb = membres.filter(m => m.role.startsWith("enfant")).length;
    if (nb >= 11) return;
    const newRole = `enfant${nb + 1}` as MembreFamille["role"];
    onChange(answers, [...membres, { role: newRole, nom: "", prenom: "", dateNaissance: "" }]);
  };

  const removeMembre = (index: number) => {
    if (index === 0) return; // principal non supprimable
    const filtered = membres.filter((_, i) => i !== index);
    // Renuméroter les conjoints et enfants pour garder la cohérence
    let cj = 0; let en = 0;
    const renumbered = filtered.map(m => {
      if (m.role === "principal") return m;
      if (m.role.startsWith("conjoint")) {
        cj++;
        return { ...m, role: `conjoint${cj}` as MembreFamille["role"] };
      }
      en++;
      return { ...m, role: `enfant${en}` as MembreFamille["role"] };
    });
    // Nettoyer les réponses du membre supprimé
    const removedRole = membres[index].role;
    const cleanAnswers = { ...answers };
    QUESTIONS.forEach(q => { delete cleanAnswers[`${q.num}_${removedRole}`]; });
    onChange(cleanAnswers, renumbered);
  };

  const setAnswer = (key: string, val: string) =>
    onChange({ ...answers, [key]: val }, membres);

  // ── Impression ──────────────────────────────────────────────────────────────

  const handlePrint = () => {
    const rows = QUESTIONS.map(q => {
      const cells = membres.map(m => {
        const val = answers[`${q.num}_${m.role}`];
        const display = val === "oui"
          ? '<span style="color:green;font-weight:bold;">OUI</span>'
          : val === "non"
            ? '<span style="color:#c00;">NON</span>'
            : "—";
        return `<td style="text-align:center;padding:4px 8px;border:1px solid #ddd;font-size:10px;">${display}</td>`;
      }).join("");
      return `<tr>
        <td style="padding:4px 8px;border:1px solid #ddd;font-weight:bold;color:#1B5299;white-space:nowrap;">${q.num}/</td>
        <td style="padding:4px 8px;border:1px solid #ddd;font-size:10px;">${q.text}</td>
        ${cells}
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Questionnaire Médical — Papy Services Assurances</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; margin: 24px; }
  h1   { font-size: 14px; color: #1B5299; margin-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; }
  th  { background: #1B5299; color: #fff; padding: 5px 8px; border: 1px solid #1B5299; font-size: 9px; }
  @media print { @page { size: landscape; } }
</style>
</head><body>
<h1>QUESTIONNAIRE MÉDICAL — PAPY SERVICES ASSURANCES</h1>
<p style="font-size:10px;margin-bottom:12px;">Date : ${new Date().toLocaleDateString("fr-FR")}</p>
<table>
  <thead>
    <tr>
      <th style="white-space:nowrap;">N°</th>
      <th style="text-align:left;min-width:200px;">Question</th>
      ${membres.map(m => `<th style="white-space:nowrap;">${roleLabel(m.role)}</th>`).join("")}
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<p style="font-size:9px;margin-top:14px;color:#666;">Ce questionnaire est obligatoire pour les personnes de 50 ans et plus. — Papy Services Assurances</p>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (win) win.addEventListener("load", () => { win.print(); URL.revokeObjectURL(url); });
  };

  const handleBack = () => onBack ? onBack() : navigate("/admin/maladie-famille");

  const nbConjoints = membres.filter(m => m.role.startsWith("conjoint")).length;
  const nbEnfants   = membres.filter(m => m.role.startsWith("enfant")).length;

  // ── Rendu ───────────────────────────────────────────────────────────────────

  const inner = (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">

      {/* En-tête étape */}
      <div className="rounded-2xl p-5 text-white" style={{ background: "#1B5299" }}>
        <div className="flex items-center gap-3">
          {embedded && (
            <button type="button" onClick={handleBack}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">1/3</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Questionnaire Médical</h1>
            <p className="text-white/80 text-xs">Étape 1 — Informations familiales et médicales</p>
          </div>
        </div>
      </div>

      {/* ── Membres de la famille ── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-600 font-black text-sm">2</span>
            </span>
            <div>
              <p className="text-base font-bold">Membres de la famille</p>
              <p className="text-xs text-muted-foreground">Renseignez les informations des personnes à assurer</p>
            </div>
          </div>
          {/* Boutons d'ajout */}
          <div className="flex items-center gap-2 shrink-0">
            {nbConjoints < 2 && (
              <Button type="button" variant="outline" size="sm" onClick={addConjoint}
                className="text-xs h-8 border-pink-300 text-pink-700 hover:bg-pink-50">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Conjoint{nbConjoints === 0 ? "" : "(e)"}
              </Button>
            )}
            {nbEnfants < 11 && (
              <Button type="button" variant="outline" size="sm" onClick={addEnfant}
                className="text-xs h-8 border-blue-300 text-blue-700 hover:bg-blue-50">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Enfant
              </Button>
            )}
          </div>
        </div>

        {/* Tableau membres */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: "#1B5299", color: "#fff" }}>
                <th className="text-left px-4 py-3 font-semibold w-40 border-r border-blue-400">Rôle</th>
                <th className="px-3 py-3 font-semibold border-r border-blue-400 text-left">Nom</th>
                <th className="px-3 py-3 font-semibold border-r border-blue-400 text-left">Prénom</th>
                <th className="px-3 py-3 font-semibold text-left">Date de naissance</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {membres.map((m, idx) => (
                <tr key={m.role} className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
                  {/* Rôle */}
                  <td className="px-4 py-2.5 border-r border-gray-200">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      m.role === "principal"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : m.role.startsWith("conjoint")
                          ? "bg-pink-100 text-pink-700 border-pink-200"
                          : "bg-green-100 text-green-700 border-green-200"
                    }`}>
                      {roleLabel(m.role)}
                    </span>
                  </td>
                  {/* Nom */}
                  <td className="px-3 py-2 border-r border-gray-100">
                    <Input value={m.nom} onChange={e => updateMembre(idx, "nom", e.target.value)}
                      placeholder="Nom" className="h-8 text-sm" />
                  </td>
                  {/* Prénom */}
                  <td className="px-3 py-2 border-r border-gray-100">
                    <Input value={m.prenom} onChange={e => updateMembre(idx, "prenom", e.target.value)}
                      placeholder="Prénom" className="h-8 text-sm" />
                  </td>
                  {/* Date de naissance */}
                  <td className="px-3 py-2">
                    <Input type="date" value={m.dateNaissance || ""}
                      onChange={e => updateMembre(idx, "dateNaissance", e.target.value)}
                      className="h-8 text-sm" />
                  </td>
                  {/* Supprimer (sauf principal) */}
                  <td className="px-2 py-2 text-center">
                    {idx > 0 && (
                      <button type="button" onClick={() => removeMembre(idx)}
                        className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          {membres.length} personne{membres.length > 1 ? "s" : ""} — principal + {membres.length - 1} bénéficiaire{membres.length > 2 ? "s" : ""}
        </p>
      </Card>

      {/* ── Questionnaire Médical ── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-600 font-black text-sm">3</span>
          </span>
          <div>
            <p className="text-base font-bold">Questionnaire Médical</p>
            <p className="text-xs text-muted-foreground">Répondre par OUI ou NON pour chaque membre · Obligatoire pour les 50 ans et plus</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse" style={{ minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#1B5299", color: "#fff" }}>
                {/* Colonne question — large */}
                <th
                  className="text-left p-3 font-semibold border-r border-blue-400 sticky left-0 z-10"
                  style={{ background: "#1B5299", minWidth: 380, width: 380 }}
                >
                  Question
                </th>
                {membres.map(m => (
                  <th key={m.role} className="p-2 text-center font-semibold border-r border-blue-400" style={{ minWidth: 80 }}>
                    <span className="block text-[10px] leading-tight whitespace-nowrap">{roleLabel(m.role)}</span>
                    {m.nom && <span className="block text-[9px] font-normal opacity-80 truncate max-w-[76px]">{m.nom}</span>}
                    <span className="flex justify-center gap-4 text-[9px] font-normal mt-0.5 opacity-70">
                      <span>OUI</span><span>NON</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QUESTIONS.map((q, qi) => (
                <tr key={q.num} className={`border-t ${qi % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
                  {/* Question */}
                  <td
                    className="p-3 border-r border-gray-200 sticky left-0"
                    style={{ background: qi % 2 === 0 ? "#fff" : "#f9fafb", minWidth: 380 }}
                  >
                    <span className="font-bold mr-1.5 text-sm" style={{ color: "#1B5299" }}>{q.num}.</span>
                    <span className="text-gray-700 text-xs leading-relaxed">{q.text}</span>
                  </td>
                  {/* Réponses par membre */}
                  {membres.map(m => {
                    const key = `${q.num}_${m.role}`;
                    return (
                      <td key={m.role} className="p-1 border-r border-gray-100 text-center">
                        <div className="flex justify-center gap-3">
                          <label className="flex flex-col items-center gap-0.5 cursor-pointer">
                            <input type="radio" name={key} value="oui"
                              checked={answers[key] === "oui"}
                              onChange={() => setAnswer(key, "oui")}
                              className="w-4 h-4 accent-blue-700"
                            />
                            <span className="text-[8px] text-blue-600 font-medium">O</span>
                          </label>
                          <label className="flex flex-col items-center gap-0.5 cursor-pointer">
                            <input type="radio" name={key} value="non"
                              checked={answers[key] === "non"}
                              onChange={() => setAnswer(key, "non")}
                              className="w-4 h-4 accent-red-500"
                            />
                            <span className="text-[8px] text-red-500 font-medium">N</span>
                          </label>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground italic px-1">
        Ce questionnaire est obligatoire pour les personnes de 50 ans et plus. Les réponses servent à l'évaluation du risque et ne constituent pas une décision de couverture.
      </p>

      {/* Actions */}
      <div className="flex justify-between gap-3">
        <Button type="button" onClick={handlePrint} style={{ background: "#1B5299" }}>
          Imprimer / Télécharger
        </Button>
        <div className="flex gap-3">
          <Button variant="destructive" onClick={handleBack}>
            Annuler
          </Button>
          <Button onClick={onContinue} style={{ background: "#1B5299" }}>
            Continuer vers la proposition →
          </Button>
        </div>
      </div>

    </div>
  );

  if (embedded) return inner;

  return (
    <AppLayout subHeader={
      <Button size="sm" onClick={handleBack}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    }>
      {inner}
    </AppLayout>
  );
}
