import { useLayoutEffect } from "react";
import { useSearchParams } from "react-router-dom";
import FamilleFormStep from "./nouvelle-famille/FamilleFormStep";

// Re-exports pour les pages qui importent depuis ce fichier
export {
  PRIME_ENFANT, PRIME_ADULTE, PRIME_ADULTE_AGE, TAUX_TAXE,
  TYPE_LABELS, TYPE_PRICES, TYPE_COLORS,
  GARANTIES_CNART, REAJUSTEMENT_SP, DUREES,
  typeFromDate, calcDecompte, getGarantiesCNART, newBeneficiaire,
} from "./nouvelle-famille/types";
export type { TypeAssure, Beneficiaire } from "./nouvelle-famille/types";

export default function NewFamillePage() {
  useLayoutEffect(() => {
    document.querySelector("main")?.scrollTo(0, 0);
  }, []);

  return <FamilleFormStep questAnswers={{}} onBack={() => history.back()} />;
}
