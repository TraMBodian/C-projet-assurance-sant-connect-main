import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BRAND = "#1B5299";
const API   = import.meta.env.VITE_API_BASE_URL || "/api";

interface VerifyData {
  found:    boolean;
  numero:   string;
  nom:      string;
  prenom:   string;
  statut:   string;
  actif:    boolean;
  dateFin:  string;
  garantie: string;
  type:     string;
  photo?:   string;
  message?: string;
}

function fmt(d?: string) {
  if (!d) return "—";
  try {
    // si déjà au format dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
    return new Date(d).toLocaleDateString("fr-FR");
  } catch { return d; }
}

export default function VerifyPage() {
  const { numero } = useParams<{ numero: string }>();
  const navigate   = useNavigate();
  const [data,    setData]    = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!numero) { setError(true); setLoading(false); return; }
    fetch(`${API}/public/verify/${encodeURIComponent(numero)}`)
      .then(r => {
        if (!r.ok && r.status !== 404) throw new Error("server");
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [numero]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "#f8fafc" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-[#1B5299] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Vérification en cours…</p>
        </div>
      </div>
    );
  }

  // ── Erreur réseau ──────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "#f8fafc" }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Service indisponible</h2>
          <p className="text-sm text-gray-500">Impossible de contacter le serveur. Réessayez dans quelques instants.</p>
        </div>
      </div>
    );
  }

  // ── Carte introuvable ──────────────────────────────────────────────────────
  if (!data.found) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "#f8fafc" }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Carte introuvable</h2>
          <p className="text-sm text-gray-500 mb-1">Numéro : <span className="font-mono font-semibold">{numero}</span></p>
          <p className="text-sm text-gray-400">Cette carte n'existe pas dans notre système.</p>
        </div>
      </div>
    );
  }

  const isActif = data.actif;

  // ── Résultat ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #1e3c72, #2a5298)" }}>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-in { animation: fadeInUp 0.5s ease both; }
      `}</style>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <img src="/logo1.png" alt="PSA" className="h-10 object-contain drop-shadow"
          onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
        <div>
          <p className="font-black text-white text-sm leading-tight">PAPY SERVICES ASSURANCES</p>
          <p className="text-white/60 text-xs">Vérification de carte</p>
        </div>
      </div>

      {/* Carte résultat */}
      <div className="card-in bg-white rounded-2xl w-full max-w-sm overflow-hidden"
        style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.25)" }}>

        {/* Bandeau statut */}
        <div className={`flex items-center justify-center gap-2 py-4 ${isActif ? "bg-green-50" : "bg-red-50"}`}>
          <div className={`w-4 h-4 rounded-full ${isActif ? "bg-green-500" : "bg-red-500"} shadow-sm`}
            style={{ boxShadow: isActif ? "0 0 8px #22c55e" : "0 0 8px #ef4444" }} />
          <span className={`text-lg font-black tracking-wide ${isActif ? "text-green-700" : "text-red-700"}`}>
            {isActif ? "CARTE VALIDE" : "CARTE EXPIRÉE / INACTIVE"}
          </span>
        </div>

        {/* Infos */}
        <div className="p-6 space-y-4">

          {/* Numéro */}
          <div className="text-center pb-3 border-b border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Numéro de carte</p>
            <p className="font-mono font-bold text-gray-900 text-base">{data.numero}</p>
          </div>

          {/* Titulaire + Photo anti-fraude */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
            <div className="relative shrink-0">
              {data.photo ? (
                <div className="rounded-lg overflow-hidden" style={{ width: 56, height: 72 }}>
                  <img src={data.photo} alt="photo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0"
                  style={{ background: BRAND }}>
                  {(data.nom?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-black text-white px-1 py-0.5 rounded-sm whitespace-nowrap"
                style={{ background: BRAND }}>
                ASSURÉ
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Titulaire</p>
              <p className="font-bold text-gray-900">{data.nom} {data.prenom}</p>
              <p className="text-xs text-gray-500">Type : {data.type}</p>
              {data.photo && (
                <p className="text-[10px] text-green-600 font-medium mt-0.5">✓ Identité vérifiable visuellement</p>
              )}
            </div>
          </div>

          {/* Grille infos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Statut</p>
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${isActif ? "text-green-700" : "text-red-600"}`}>
                <span className={`w-2 h-2 rounded-full ${isActif ? "bg-green-500" : "bg-red-500"}`} />
                {data.statut}
              </span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Valide jusqu'au</p>
              <p className="text-sm font-bold text-gray-900">{fmt(data.dateFin)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Garantie</p>
              <p className="text-sm font-bold text-gray-900">{data.garantie}</p>
            </div>
          </div>

          {/* Avertissement masquage */}
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Les informations complètes sont accessibles aux professionnels de santé autorisés.
          </p>
        </div>

        {/* Bouton accès professionnel */}
        <div className="px-6 pb-6">
          <button
            onClick={() => navigate(`/login?redirect=/verify/${numero}`)}
            className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: `linear-gradient(135deg, #2a5298, #1e3c72)` }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Accès professionnel (prestataire)
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Accédez à l'historique complet et aux actes médicaux
          </p>
        </div>
      </div>

      {/* Pied */}
      <p className="text-white/40 text-xs mt-6 text-center">
        © {new Date().getFullYear()} Papy Services Assurances · papyservicesassurances.sn
      </p>
    </div>
  );
}
