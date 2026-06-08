import { useState } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope, Phone, MapPin, Mail, Hash, CheckCircle,
  Loader2, AlertCircle, Edit, Save, X,
} from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";

const TYPE_LABELS: Record<string, string> = {
  HOPITAL:        "Hôpital",
  CLINIQUE:       "Clinique",
  PHARMACIE:      "Pharmacie",
  LABORATOIRE:    "Laboratoire",
  CABINET_MEDICAL:"Cabinet médical",
  AUTRE:          "Autre",
};

const STATUT_CFG: Record<string, { label: string; style: string }> = {
  ACTIF:    { label: "Actif",    style: "bg-green-100 text-green-700 border-green-200" },
  INACTIF:  { label: "Inactif", style: "bg-gray-100 text-gray-600 border-gray-200"   },
  SUSPENDU: { label: "Suspendu",style: "bg-red-100 text-red-700 border-red-200"       },
};

export default function ProfilPrestatairePage() {
  const { myPrestataire, refreshMyPrestataire } = useAuth();

  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [telephone, setTelephone] = useState(myPrestataire?.telephone ?? "");
  const [adresse,   setAdresse]   = useState(myPrestataire?.adresse   ?? "");

  const startEdit = () => {
    setTelephone(myPrestataire?.telephone ?? "");
    setAdresse(myPrestataire?.adresse   ?? "");
    setError(null);
    setSuccess(false);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiClient.patchMyPrestataire({ telephone, adresse });
      await refreshMyPrestataire();
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Impossible de sauvegarder les modifications. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  if (!myPrestataire) {
    return (
      <AppLayout title="Mon Profil Prestataire">
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
          <AlertCircle size={36} className="text-destructive opacity-60" />
          <p className="font-medium text-sm">Aucun profil prestataire associé à ce compte</p>
          <p className="text-xs text-muted-foreground">Contactez votre administrateur</p>
        </div>
      </AppLayout>
    );
  }

  const statutCfg = STATUT_CFG[myPrestataire.statut ?? "ACTIF"] ?? STATUT_CFG.ACTIF;
  const initiales = myPrestataire.nom.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <AppLayout title="Mon Profil Prestataire">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-24 translate-x-24" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/10 rounded-full translate-y-18 -translate-x-18" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0">
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-blue-100">Prestataire de santé</p>
              <h2 className="text-xl font-bold truncate mt-0.5">{myPrestataire.nom}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-blue-100">
                  {TYPE_LABELS[myPrestataire.type] ?? myPrestataire.type}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statutCfg.style}`}>
                  {statutCfg.label}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">Informations du cabinet</h3>
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Edit size={13} className="mr-1.5" />
                Modifier
              </Button>
            )}
          </div>

          <div className="p-4 space-y-3">

            {/* Champs lecture seule */}
            {[
              { icon: <Hash size={15} />,        label: "Numéro",  value: myPrestataire.numero },
              { icon: <Mail size={15} />,         label: "Email",   value: myPrestataire.email  },
              { icon: <Stethoscope size={15} />,  label: "Type",    value: TYPE_LABELS[myPrestataire.type] ?? myPrestataire.type },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-gray-900 mt-0.5 truncate">{value || "—"}</p>
                </div>
              </div>
            ))}

            {/* Téléphone — éditable */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                <Phone size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Téléphone</p>
                {editing ? (
                  <input
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="mt-1 w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-0.5">{myPrestataire.telephone || "—"}</p>
                )}
              </div>
            </div>

            {/* Adresse — éditable */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                <MapPin size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Adresse</p>
                {editing ? (
                  <textarea
                    value={adresse}
                    onChange={e => setAdresse(e.target.value)}
                    placeholder="Adresse complète du cabinet"
                    rows={2}
                    className="mt-1 w-full text-sm border border-input rounded-lg px-3 py-1.5 bg-background outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-900 mt-0.5">{myPrestataire.adresse || "—"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions édition */}
          {editing && (
            <div className="px-4 py-3 border-t border-border flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancel} disabled={saving}>
                <X size={13} className="mr-1" />
                Annuler
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                ) : (
                  <Save size={13} className="mr-1.5" />
                )}
                Enregistrer
              </Button>
            </div>
          )}
        </motion.div>

        {/* Feedback */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium"
          >
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            Profil mis à jour avec succès
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-medium"
          >
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Note sécurité */}
        <p className="text-[11px] text-muted-foreground text-center px-4">
          Le nom, le numéro, l'email et le type sont gérés par votre administrateur.
          Seuls le téléphone et l'adresse peuvent être modifiés ici.
        </p>
      </div>
    </AppLayout>
  );
}
