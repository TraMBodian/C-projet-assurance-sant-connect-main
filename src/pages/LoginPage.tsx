import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Zap, Building2 } from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [loading,        setLoading]        = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [blockedUntil,   setBlockedUntil]   = useState<number | null>(null);
  const [showPassword,   setShowPassword]   = useState(false);
  const [loginError,     setLoginError]     = useState("");

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!email || !password) {
      setLoginError("Veuillez remplir tous les champs.");
      return;
    }
    if (blockedUntil && Date.now() < blockedUntil) {
      const remaining = Math.ceil((blockedUntil - Date.now()) / 60000);
      setLoginError(`Trop de tentatives. Réessayez dans ${remaining} minute(s).`);
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      setFailedAttempts(0);
      setBlockedUntil(null);
      navigate('/dashboard');
    } catch (error: any) {
      const msg: string = error?.message || "";
      if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("Délai")) {
        setLoginError("Impossible de contacter le serveur. Veuillez réessayer.");
        return;
      }
      if (
        msg.toLowerCase().includes("attente") ||
        msg.toLowerCase().includes("pending") ||
        msg.toLowerCase().includes("approv")
      ) {
        setLoginError("Votre compte est en cours de validation par un administrateur.");
        return;
      }
      if (msg.toLowerCase().includes("rejeté") || msg.toLowerCase().includes("rejet")) {
        setLoginError("Votre compte a été rejeté. Contactez l'administrateur.");
        return;
      }
      if (msg.toLowerCase().includes("suspendu")) {
        setLoginError("Votre compte est suspendu. Contactez l'administrateur.");
        return;
      }
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        setBlockedUntil(Date.now() + 5 * 60 * 1000);
        setLoginError("5 tentatives échouées. Compte bloqué pendant 5 minutes.");
      } else {
        setLoginError(`Email ou mot de passe incorrect. (${5 - newAttempts} tentative(s) restante(s))`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-animate { animation: fadeInUp 0.6s ease both; }
        .btn-gradient {
          background: linear-gradient(135deg, #2a5298, #1e3c72);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .btn-gradient:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.22);
        }
        .input-focus:focus {
          border-color: #2a5298 !important;
          box-shadow: 0 0 0 3px rgba(42,82,152,0.12) !important;
          outline: none;
        }
      `}</style>

      {/* ── Panneau gauche ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-16 overflow-hidden"
        style={{ background: '#f8fafc' }}
      >
        <div className="relative z-10 flex flex-col items-center text-center">
          <img src="/logo1.png" alt="Logo" className="w-36 h-36 object-contain mb-6 drop-shadow-sm" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-3 text-[#1e3c72]">
            Papy Services Assurances
          </h1>
          <p className="text-gray-500 text-base max-w-xs leading-relaxed">
            La plateforme de gestion d'assurance santé nouvelle génération
          </p>
          <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
            {[
              { icon: <ShieldCheck size={18} className="text-[#2a5298] shrink-0" />, text: "Données sécurisées & chiffrées" },
              { icon: <Zap        size={18} className="text-[#2a5298] shrink-0" />, text: "Accès instantané à vos polices" },
              { icon: <Building2  size={18} className="text-[#2a5298] shrink-0" />, text: "Réseau de prestataires certifiés" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-700"
                style={{ background: 'rgba(42,82,152,0.06)', border: '1px solid rgba(42,82,152,0.12)' }}
              >
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit ────────────────────────────────────────── */}
      <div
        className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3c72, #2a5298)' }}
      >
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo mobile */}
        <div className="lg:hidden flex flex-col items-center mb-8 relative z-10">
          <img src="/logo1.png" alt="Logo" className="w-20 h-20 object-contain mb-3 drop-shadow" />
          <p className="font-bold text-white text-lg tracking-tight">Papy Services Assurances</p>
        </div>

        {/* Carte formulaire */}
        <div
          className="card-animate relative z-10 w-full max-w-sm sm:max-w-md bg-white rounded-2xl p-5 xs:p-7 sm:p-10"
          style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Bon retour</h2>
            <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre espace personnel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Adresse email</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                  required
                  className="input-focus h-11 text-sm rounded-xl border-gray-200 pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</Label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-[#2a5298] hover:text-[#1e3c72] hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  required
                  className="input-focus h-11 text-sm rounded-xl border-gray-200 pl-9 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {loginError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                <svg className="shrink-0 mt-0.5" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="btn-gradient w-full h-11 rounded-xl text-sm font-bold text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Connexion en cours...
                </span>
              ) : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-[#2a5298] hover:text-[#1e3c72] hover:underline font-semibold"
              >
                Créer un compte
              </button>
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-[#2a5298] hover:underline transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>

        <p className="relative z-10 mt-6 text-xs text-white/50 text-center">
          © {new Date().getFullYear()} Papy Services Assurances. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
