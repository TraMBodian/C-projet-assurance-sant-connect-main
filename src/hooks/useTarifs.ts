import { useState, useEffect } from "react";
import { getTarifs, TARIF_DEFAULTS, type TarifSettings } from "@/services/tarifService";

export function useTarifs(): TarifSettings {
  const [tarifs, setTarifs] = useState<TarifSettings>(TARIF_DEFAULTS);

  useEffect(() => {
    getTarifs().then(setTarifs).catch(() => {});
  }, []);

  return tarifs;
}
