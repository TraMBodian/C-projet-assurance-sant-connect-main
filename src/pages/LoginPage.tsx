import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Zap, Building2 } from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }
    if (blockedUntil && Date.now() < blockedUntil) {
      const remaining = Math.ceil((blockedUntil - Date.now()) / 60000);
      toast({ title: "Compte temporairement bloqué", description: `Trop de tentatives. Réessayez dans ${remaining} minute(s).`, variant: "destructive" });
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
      // Backend inaccessible
      if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("Délai")) {
        toast({
          title: "Serveur inaccessible",
          description: "Impossible de contacter le serveur. Veuillez réessayer dans quelques instants.",
          variant: "destructive",
        });
        return;
      }
      // Compte en attente d'approbation
      if (msg.toLowerCase().includes("attente") || msg.toLowerCase().includes("pending") || msg.toLowerCase().includes("approv")) {
        toast({
          title: "Compte en attente",
          description: "Votre compte est en cours de validation par un administrateur.",
          variant: "destructive",
        });
        return;
      }
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      if (newAttempts >= 5) {
        const blockTime = Date.now() + 5 * 60 * 1000;
        setBlockedUntil(blockTime);
        toast({ title: "Compte bloqué", description: "5 tentatives échouées. Compte bloqué pendant 5 minutes.", variant: "destructive" });
      } else {
        toast({ title: "Erreur de connexion", description: `${msg || "Email ou mot de passe incorrect"} (${5 - newAttempts} tentative(s) restante(s))`, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Réinitialisation non disponible",
      description: "Veuillez contacter l'administrateur pour réinitialiser votre mot de passe.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Panneau gauche : branding ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden bg-brand">
        {/* Cercles décoratifs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-24 -right-16 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-blue-300/10 rounded-full blur-2xl" />

        {/* Contenu */}
        <div className="relative z-10 flex flex-col items-center text-center text-white">
          <img src="/logo1.png" alt="Logo" className="w-24 h-24 object-contain drop-shadow-2xl mb-6" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-3">Papy Services Assurances</h1>
          <p className="text-blue-100 text-base max-w-xs leading-relaxed">
            La plateforme de gestion d'assurance santé nouvelle génération
          </p>

          {/* Badges de confiance */}
          <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
            {[
              { icon: <ShieldCheck size={18} className="text-blue-200 shrink-0" />, text: "Données sécurisées & chiffrées" },
              { icon: <Zap size={18} className="text-blue-200 shrink-0" />, text: "Accès instantané à vos polices" },
              { icon: <Building2 size={18} className="text-blue-200 shrink-0" />, text: "Réseau de prestataires certifiés" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-sm">
                {item.icon}
                <span className="text-blue-50">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit : formulaire ──────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 bg-gray-50 relative overflow-hidden">

        {/* Fond mobile : dégradé subtil */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-blue-50 to-gray-50 pointer-events-none" />

        {/* Logo visible uniquement sur mobile */}
        <div className="lg:hidden flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-lg mb-3">
            <img src="/logo1.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <p className="font-bold text-gray-800 text-lg tracking-tight">Papy Services Assurances</p>
        </div>

        {/* Carte formulaire */}
        <div className="relative z-10 w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl p-7 sm:p-10 border border-gray-100">

          {/* En-tête */}
          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {showReset ? "Réinitialiser" : "Bon retour"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {showReset ? "Modifiez votre mot de passe ci-dessous" : "Connectez-vous à votre espace personnel"}
            </p>
          </div>

          {!showReset ? (
            <>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 text-sm rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</Label>
                    <button
                      type="button"
                      onClick={() => setShowReset(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 text-sm rounded-xl border-gray-200 focus:border-blue-500 pr-10"
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

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all bg-brand hover:bg-brand-dark"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Connexion en cours...
                    </span>
                  ) : "Se connecter"}
                </Button>
              </form>

              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">
                  Pas encore de compte ?{" "}
                  <button type="button" onClick={() => navigate('/signup')} className="text-blue-600 hover:underline font-semibold">
                    Créer un compte
                  </button>
                </p>
                <button type="button" onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
                  ← Retour à l'accueil
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="resetEmail" className="text-sm font-medium text-gray-700">Email du compte</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="votre@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="h-11 text-sm rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="h-11 text-sm rounded-xl border-gray-200 pr-10"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmNewPassword" className="text-sm font-medium text-gray-700">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className="h-11 text-sm rounded-xl border-gray-200 pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-brand hover:bg-brand-dark text-sm font-semibold"
                >
                  Modifier le mot de passe
                </Button>
              </form>
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  ← Retour à la connexion
                </button>
              </div>
            </>
          )}
        </div>

        {/* Pied de page */}
        <p className="relative z-10 mt-6 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Papy Services Assurances. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
