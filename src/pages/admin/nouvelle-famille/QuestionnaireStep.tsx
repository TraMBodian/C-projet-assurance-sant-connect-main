import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "@/components/ui/Icons";

const QUEST_COLS = [
  "principal","conjoint1","conjoint2",
  "enfant1","enfant2","enfant3","enfant4","enfant5","enfant6",
  "enfant7","enfant8","enfant9","enfant10","enfant11",
];

const QUEST_COL_LABELS = [
  "Assuré principal","1er conjoint","2e conjoint",
  "1er enfant","2e enfant","3e enfant","4e enfant","5e enfant","6e enfant",
  "7e enfant","8e enfant","9e enfant","10e enfant","11e enfant",
];

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

interface Props {
  answers:    Record<string, string>;
  onChange:   (answers: Record<string, string>) => void;
  onContinue: () => void;
  onBack?:    () => void;
  embedded?:  boolean;
}

export default function QuestionnaireStep({ answers, onChange, onContinue, onBack, embedded }: Props) {
  const navigate = useNavigate();

  const setAnswer = (key: string, val: string) =>
    onChange({ ...answers, [key]: val });

  const handlePrint = () => {
    const rows = QUESTIONS.map(q => {
      const cells = QUEST_COLS.map(col => {
        const val = answers[`${q.num}_${col}`];
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
<p style="font-size:10px;margin-bottom:12px;">Date&nbsp;: ${new Date().toLocaleDateString("fr-FR")}</p>
<table>
  <thead>
    <tr>
      <th style="white-space:nowrap;">N°</th>
      <th style="text-align:left;min-width:180px;">Question</th>
      ${QUEST_COL_LABELS.map(l => `<th style="white-space:nowrap;">${l}</th>`).join("")}
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<p style="font-size:9px;margin-top:14px;color:#666;">Ce questionnaire est obligatoire pour les personnes de 50 ans et plus. — Papy Services Assurances</p>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, "_blank");
    if (win) {
      win.addEventListener("load", () => { win.print(); URL.revokeObjectURL(url); });
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate("/admin/maladie-famille");
  };

  const inner = (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">

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
            <p className="text-white/80 text-xs">Étape 1 — À compléter avant la proposition · Répondre par OUI ou NON</p>
          </div>
        </div>
      </div>

        {/* Tableau */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse" style={{ minWidth: 920 }}>
              <thead>
                <tr style={{ background: "#1B5299", color: "#fff" }}>
                  <th
                    className="text-left p-3 font-semibold w-60 border-r border-blue-400 sticky left-0 z-10"
                    style={{ background: "#1B5299" }}
                  >
                    Question
                  </th>
                  {QUEST_COL_LABELS.map((col, ci) => (
                    <th key={ci} className="p-2 text-center font-semibold border-r border-blue-400 whitespace-nowrap min-w-[64px]">
                      <span className="block text-[10px]">{col}</span>
                      <span className="flex justify-center gap-3 text-[9px] font-normal mt-0.5 opacity-80">
                        <span>OUI</span><span>NON</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {QUESTIONS.map((q, qi) => (
                  <tr key={q.num} className={`border-t ${qi % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
                    <td
                      className="p-2.5 border-r border-gray-200 sticky left-0"
                      style={{ background: qi % 2 === 0 ? "#fff" : "#f9fafb" }}
                    >
                      <span className="font-bold mr-1" style={{ color: "#1B5299" }}>{q.num}/</span>
                      <span className="text-gray-700">{q.text}</span>
                    </td>
                    {QUEST_COLS.map(col => {
                      const key = `${q.num}_${col}`;
                      return (
                        <td key={col} className="p-1 border-r border-gray-100 text-center">
                          <div className="flex justify-center gap-3">
                            <label className="flex items-center gap-0.5 cursor-pointer">
                              <input
                                type="radio" name={key} value="oui"
                                checked={answers[key] === "oui"}
                                onChange={() => setAnswer(key, "oui")}
                                className="w-3.5 h-3.5 accent-blue-700"
                              />
                              <span className="text-[9px] text-gray-400">O</span>
                            </label>
                            <label className="flex items-center gap-0.5 cursor-pointer">
                              <input
                                type="radio" name={key} value="non"
                                checked={answers[key] === "non"}
                                onChange={() => setAnswer(key, "non")}
                                className="w-3.5 h-3.5 accent-red-500"
                              />
                              <span className="text-[9px] text-gray-400">N</span>
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
