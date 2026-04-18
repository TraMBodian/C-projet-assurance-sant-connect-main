import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, UserPlus, UserMinus, Calculator, Check, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getTarifs } from "@/services/tarifService";
import { typeFromDate, TYPE_LABELS, TYPE_COLORS, type TypeAssure } from "@/pages/NewFamillePage";
import { DataService } from "@/services/dataService";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonneMouvement {
  nom:           string;
  lien:          string;
  type:          TypeAssure;
  dateNaissance: string;
}

export interface MouvementRecord {
  id:                  number;
  contratId:           number;
  contratType:         "famille" | "groupe";
  contratNom:          string;
  type:                "incorporation" | "retrait";
  dateOperation:       string;
  echeance:            string;
  joursRestants:       number;
  personnes:           PersonneMouvement[];
  primeNettePersonnes: number;
  montant:             number;
  createdAt:           string;
}

interface MouvementModalProps {
  contrat:     any;
  contratType: "famille" | "groupe";
  onClose:     () => void;
  onSaved:     () => void;
}

// ─── LocalStorage mouvements ──────────────────────────────────────────────────

const LS_MOV = "cnart_mouvements_local";

export function loadMouvements(): MouvementRecord[] {
  try { return JSON.parse(localStorage.getItem(LS_MOV) ?? "[]"); } catch { return []; }
}

function saveMouvements(list: MouvementRecord[]): void {
  localStorage.setItem(LS_MOV, JSON.stringify(list));
}

// ─── Helpers calcul ───────────────────────────────────────────────────────────

function getEcheanceDate(contrat: any): Date | null {
  if (!contrat.dateDebut) return null;
  const d = new Date(contrat.dateDebut);
  d.setFullYear(d.getFullYear() + Number(contrat.dureeGarantie || 1));
  d.setDate(d.getDate() - 1);
  return d;
}

function calcJoursRestants(dateOp: string, echeance: Date): number {
  const op = new Date(dateOp);
  return Math.max(0, Math.round((echeance.getTime() - op.getTime()) / 86_400_000));
}

function primeForType(type: TypeAssure, tarifs: { primeEnfant: number; primeAdulte: number; primeAdulteAge: number }): number {
  if (type === "enfant")     return tarifs.primeEnfant;
  if (type === "adulte_age") return tarifs.primeAdulteAge;
  return tarifs.primeAdulte;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function MouvementModal({ contrat, contratType, onClose, onSaved }: MouvementModalProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [typeMov,          setTypeMov]          = useState<"incorporation" | "retrait">("incorporation");
  const [dateOp,           setDateOp]           = useState(today);
  const [personnes,        setPersonnes]        = useState<PersonneMouvement[]>([
    { nom: "", lien: "", type: "adulte", dateNaissance: "" },
  ]);
  const [selectedRetrait,  setSelectedRetrait]  = useState<Set<string>>(new Set());
  const [saving,           setSaving]           = useState(false);
  const [done,             setDone]             = useState(false);

  // Tarifs stockés sur le contrat ou tarifs courants
  const tarifs = {
    primeEnfant:    Number(contrat.tarifPrimeEnfant)    || getTarifs().primeEnfant,
    primeAdulte:    Number(contrat.tarifPrimeAdulte)    || getTarifs().primeAdulte,
    primeAdulteAge: Number(contrat.tarifPrimeAdulteAge) || getTarifs().primeAdulteAge,
  };

  const echeance    = getEcheanceDate(contrat);
  const echeanceStr = echeance?.toLocaleDateString("fr-FR") ?? "—";
  const jours       = echeance && dateOp ? calcJoursRestants(dateOp, echeance) : 0;

  // Bénéficiaires actuels (pour retrait)
  const benefs: PersonneMouvement[] = useMemo(() => {
    if (contratType === "famille") {
      const detail = contrat.beneficiairesDetail || [];
      const principal: PersonneMouvement = {
        nom:           contrat.principal || "Principal",
        lien:          "Souscripteur",
        type:          contrat.typePrincipal || "adulte",
        dateNaissance: contrat.dateNaissancePrincipal || "",
      };
      return [principal, ...detail.map((b: any) => ({
        nom:           b.nom || "",
        lien:          b.lien || "",
        type:          b.type || "adulte",
        dateNaissance: b.dateNaissance || "",
      }))];
    } else {
      // groupe : membres depuis employesDetail
      const raw = contrat.employesDetail;
      let detail: any[] = [];
      if (Array.isArray(raw)) detail = raw;
      else if (typeof raw === "string") { try { detail = JSON.parse(raw); } catch { detail = []; } }
      return detail.map((m: any) => ({
        nom:           m.nom || "",
        lien:          m.lien || "Employé",
        type:          m.type || typeFromDate(m.dateNaissance || ""),
        dateNaissance: m.dateNaissance || "",
      }));
    }
  }, [contrat, contratType]);

  // PN des personnes concernées par le mouvement
  const primeNettePersonnes = useMemo(() => {
    if (typeMov === "incorporation") {
      return personnes.reduce((acc, p) => acc + primeForType(p.type, tarifs), 0);
    } else {
      return benefs
        .filter(b => selectedRetrait.has(b.nom))
        .reduce((acc, b) => acc + primeForType(b.type, tarifs), 0);
    }
  }, [typeMov, personnes, selectedRetrait, benefs, tarifs]);

  const montant = Math.round(primeNettePersonnes * jours / 365);

  const canShowCalc = jours > 0 && primeNettePersonnes > 0;
  const canSave = canShowCalc && (
    typeMov === "incorporation"
      ? personnes.every(p => p.nom.trim())
      : selectedRetrait.size > 0
  );

  // ── Gestion personnes incorporation ──────────────────────────────────────────

  const addPersonne = () =>
    setPersonnes(p => [...p, { nom: "", lien: "", type: "adulte", dateNaissance: "" }]);

  const removePersonne = (i: number) =>
    setPersonnes(p => p.filter((_, idx) => idx !== i));

  const updatePersonne = (i: number, field: keyof PersonneMouvement, value: string) => {
    setPersonnes(prev => {
      const up = [...prev];
      up[i] = { ...up[i], [field]: value };
      if (field === "dateNaissance" && value) up[i].type = typeFromDate(value);
      return up;
    });
  };

  const toggleRetrait = (nom: string) =>
    setSelectedRetrait(prev => {
      const next = new Set(prev);
      next.has(nom) ? next.delete(nom) : next.add(nom);
      return next;
    });

  // ── Sauvegarde ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const personnesMov = typeMov === "incorporation"
        ? personnes
        : benefs.filter(b => selectedRetrait.has(b.nom));

      // Enregistrement du mouvement
      const record: MouvementRecord = {
        id:                  Date.now(),
        contratId:           contrat.id,
        contratType,
        contratNom:          contrat.principal || contrat.entreprise || contrat.nom || "Contrat",
        type:                typeMov,
        dateOperation:       dateOp,
        echeance:            echeance?.toISOString().slice(0, 10) ?? "",
        joursRestants:       jours,
        personnes:           personnesMov,
        primeNettePersonnes,
        montant,
        createdAt:           new Date().toISOString(),
      };
      saveMouvements([record, ...loadMouvements()]);

      // Mise à jour du contrat (bénéficiaires)
      if (contratType === "famille") {
        const currentDetail: any[] = contrat.beneficiairesDetail || [];
        let newDetail: any[];
        if (typeMov === "incorporation") {
          newDetail = [...currentDetail, ...personnesMov];
        } else {
          const toRemove = new Set(personnesMov.map(p => p.nom));
          newDetail = currentDetail.filter((b: any) => !toRemove.has(b.nom));
        }
        await DataService.updateFamille(contrat.id, {
          ...contrat,
          beneficiairesDetail: newDetail,
          beneficiaires: newDetail.map((b: any) => `${b.nom} (${b.lien})`),
        });
      } else {
        const raw = contrat.employesDetail;
        let currentDetail: any[] = [];
        if (Array.isArray(raw)) currentDetail = raw;
        else if (typeof raw === "string") { try { currentDetail = JSON.parse(raw); } catch { currentDetail = []; } }

        let newDetail: any[];
        if (typeMov === "incorporation") {
          newDetail = [...currentDetail, ...personnesMov];
        } else {
          const toRemove = new Set(personnesMov.map(p => p.nom));
          newDetail = currentDetail.filter((m: any) => !toRemove.has(m.nom));
        }
        await DataService.updateGroupe(contrat.id, {
          ...contrat,
          employesDetail: JSON.stringify(newDetail),
        });
      }

      setDone(true);
      toast.success(
        typeMov === "incorporation"
          ? `Incorporation enregistrée — Prime complémentaire : ${montant.toLocaleString("fr-FR")} FCFA`
          : `Retrait enregistré — Remboursement : ${montant.toLocaleString("fr-FR")} FCFA`
      );
      setTimeout(() => { onSaved(); onClose(); }, 1000);
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-background z-10">
          <div>
            <h2 className="font-bold text-base">Mouvement sur contrat</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {contrat.principal || contrat.entreprise || contrat.nom || "—"} · Échéance {echeanceStr}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Sélecteur de type */}
          <div className="grid grid-cols-2 gap-3">
            {(["incorporation", "retrait"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeMov(t)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  typeMov === t
                    ? t === "incorporation"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-red-500 bg-red-50 text-red-700"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                {t === "incorporation"
                  ? <UserPlus className="w-6 h-6" />
                  : <UserMinus className="w-6 h-6" />
                }
                <span className="font-semibold text-sm capitalize">{t}</span>
                <span className="text-xs text-center opacity-70 leading-tight">
                  {t === "incorporation"
                    ? "Ajout d'assuré(s) → prime complémentaire"
                    : "Suppression d'assuré(s) → remboursement"}
                </span>
              </button>
            ))}
          </div>

          {/* Date du mouvement */}
          <div>
            <Label>Date du mouvement</Label>
            <Input type="date" value={dateOp} onChange={e => setDateOp(e.target.value)} className="mt-1" />
            {echeance && dateOp && (
              <p className="text-xs text-muted-foreground mt-1.5 flex gap-1.5">
                <span>Jours restants jusqu'à l'échéance :</span>
                <strong className={jours === 0 ? "text-red-500" : ""}>{jours} jours</strong>
              </p>
            )}
          </div>

          {/* Incorporation : saisie des personnes */}
          {typeMov === "incorporation" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Personne(s) à incorporer</Label>
                <button
                  type="button"
                  onClick={addPersonne}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>
              {personnes.map((p, i) => (
                <div key={i} className="p-3 rounded-lg border space-y-2 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nom complet *"
                      value={p.nom}
                      onChange={e => updatePersonne(i, "nom", e.target.value)}
                      className="flex-1 h-8 text-sm"
                    />
                    {personnes.length > 1 && (
                      <button onClick={() => removePersonne(i)} className="text-red-400 hover:text-red-600 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Lien (Épouse, Fils…)"
                      value={p.lien}
                      onChange={e => updatePersonne(i, "lien", e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="date"
                      value={p.dateNaissance}
                      onChange={e => updatePersonne(i, "dateNaissance", e.target.value)}
                      className="h-8 text-sm"
                      title="Date de naissance — auto-catégorise"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(["enfant", "adulte", "adulte_age"] as TypeAssure[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updatePersonne(i, "type", t)}
                        className={`px-2 py-1 rounded border text-[10px] font-medium transition-all ${
                          p.type === t
                            ? TYPE_COLORS[t] + " ring-1 ring-current ring-offset-1"
                            : "border-gray-200 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {t === "enfant" ? "Enfant" : t === "adulte" ? "Adulte" : "Âgé"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Retrait : sélection des bénéficiaires */}
          {typeMov === "retrait" && (
            <div className="space-y-2">
              <Label>Sélectionner le(s) assuré(s) à retirer</Label>
              {benefs.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">Aucun bénéficiaire enregistré</p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {benefs.map((b, i) => {
                    const checked = selectedRetrait.has(b.nom);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleRetrait(b.nom)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                          checked
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-border hover:border-red-200 hover:bg-red-50/30"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                          checked ? "bg-red-500 border-red-500" : "border-gray-300"
                        }`}>
                          {checked && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="flex-1 text-left font-medium truncate">{b.nom}</span>
                        {b.lien && <span className="text-xs text-muted-foreground shrink-0">{b.lien}</span>}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${TYPE_COLORS[b.type] || "bg-gray-100 text-gray-600"}`}>
                          {TYPE_LABELS[b.type] || b.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Calcul prorata */}
          {canShowCalc && (
            <div className={`rounded-xl p-4 border-2 ${
              typeMov === "incorporation"
                ? "border-blue-200 bg-blue-50"
                : "border-red-200 bg-red-50"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Calcul prorata temporis</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prime Nette des assuré(s)</span>
                  <span className="font-mono font-medium">{primeNettePersonnes.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jours restants</span>
                  <span className="font-mono font-medium">{jours} / 365</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground border-t border-current/20 pt-2 mt-1">
                  <span className="italic">{primeNettePersonnes.toLocaleString("fr-FR")} × {jours} / 365</span>
                </div>
                <div className={`flex justify-between font-bold text-base pt-1 ${
                  typeMov === "incorporation" ? "text-blue-700" : "text-red-700"
                }`}>
                  <span>{typeMov === "incorporation" ? "Prime complémentaire" : "Remboursement"}</span>
                  <span className="font-mono">{montant.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
            </div>
          )}

          {/* Bouton enregistrer */}
          <Button
            onClick={handleSave}
            disabled={!canSave || saving || done}
            className={`w-full py-5 text-sm font-semibold ${
              typeMov === "incorporation"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {done ? (
              <><Check className="w-4 h-4 mr-2" /> Enregistré</>
            ) : saving ? (
              "Enregistrement…"
            ) : (
              <>
                {typeMov === "incorporation"
                  ? <><UserPlus className="w-4 h-4 mr-2" /> Enregistrer l'incorporation</>
                  : <><UserMinus className="w-4 h-4 mr-2" /> Enregistrer le retrait</>
                }
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
