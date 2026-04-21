import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Users, Mail, Phone, MapPin, Eye, EyeOff, ShieldCheck, Zap, Building2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SignupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();

  const urlRole = searchParams.get('role') as UserRole;
  const initialRole: UserRole = urlRole === 'prestataire' ? 'prestataire' : 'client';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [contactMode, setContactMode] = useState<'email' | 'telephone'>('email');
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [adresse, setAdresse] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cgAccepted, setCgAccepted] = useState(false);

  const roles: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
    { value: 'prestataire', label: 'Prestataire', description: 'Hôpital, clinique, pharmacie…', icon: <Stethoscope className="w-5 h-5" /> },
    { value: 'client',      label: 'Client',      description: 'Assuré',                        icon: <Users className="w-5 h-5" /> },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (contactMode === 'email' && !email.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer votre adresse email", variant: "destructive" });
      return;
    }
    if (contactMode === 'telephone' && !telephone.trim()) {
      toast({ title: "Erreur", description: "Veuillez entrer votre numéro de téléphone", variant: "destructive" });
      return;
    }
    if (role === 'prestataire' && !adresse.trim()) {
      toast({ title: "Erreur", description: "La localisation est obligatoire pour les prestataires", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 8 caractères", variant: "destructive" });
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins une majuscule et un chiffre", variant: "destructive" });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: "Erreur", description: "Le nom complet est requis", variant: "destructive" });
      return;
    }
    if (!cgAccepted) {
      toast({ title: "Conditions requises", description: "Vous devez accepter les Conditions Générales pour continuer", variant: "destructive" });
      return;
    }

    const finalEmail = contactMode === 'email'
      ? email.trim()
      : `TEL_${telephone.replace(/\s/g, '')}@noemail.local`;

    setLoading(true);
    try {
      await signUp(finalEmail, password, role, fullName, organization, telephone, adresse);
      toast({ title: "Compte créé avec succès !", description: "Bienvenue !" });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: "Erreur d'inscription", description: error.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Panneau gauche : branding ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden bg-blue-600 shrink-0">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-24 -right-16 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-blue-300/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center text-white">
          <img src="/logo1.png" alt="Logo" className="w-24 h-24 object-contain drop-shadow-2xl mb-6" />
          <h1 className="text-3xl font-extrabold tracking-tight mb-3">Papy Services Assurances</h1>
          <p className="text-blue-100 text-base max-w-xs leading-relaxed">
            La plateforme de gestion d'assurance santé nouvelle génération
          </p>
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
      <div className="w-full lg:w-1/2 flex flex-col items-center bg-gray-50 relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        <div className="absolute inset-0 lg:hidden bg-gradient-to-b from-blue-50 to-gray-50 pointer-events-none" />

        {/* Logo mobile */}
        <div className="lg:hidden flex flex-col items-center mb-6 relative z-10 pt-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg mb-3">
            <img src="/logo1.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <p className="font-bold text-gray-800 text-lg tracking-tight">Papy Services Assurances</p>
        </div>

        {/* Carte formulaire */}
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-7 sm:p-10 border border-gray-100 my-8 mx-6">

          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Créer un compte</h2>
            <p className="text-sm text-gray-500 mt-1">Rejoignez Papy Services Assurances</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">

            {/* Sélection du rôle */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Vous êtes</Label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      role === r.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={role === r.value ? 'text-blue-600' : 'text-gray-400'}>{r.icon}</span>
                      <span className="font-semibold text-sm">{r.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{r.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Nom complet */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Nom complet <span className="text-red-500">*</span>
              </Label>
              <Input id="fullName" type="text" placeholder="Prénom Nom" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required
                className="h-11 text-sm rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
            </div>

            {/* Organisation (prestataire) */}
            {role === 'prestataire' && (
              <div className="space-y-1.5">
                <Label htmlFor="organization" className="text-sm font-medium text-gray-700">Organisation / Établissement</Label>
                <Input id="organization" type="text" placeholder="Ex : Clinique Pasteur…" value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="h-11 text-sm rounded-xl border-gray-200 focus:border-blue-500" />
              </div>
            )}

            {/* Contact */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Moyen de contact <span className="text-red-500">*</span>
              </Label>
              <div className="flex rounded-xl border border-input overflow-hidden">
                <button type="button" onClick={() => setContactMode('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                    contactMode === 'email' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}>
                  <Mail size={14} /> Email
                </button>
                <button type="button" onClick={() => setContactMode('telephone')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                    contactMode === 'telephone' ? 'bg-blue-600 text-white' : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}>
                  <Phone size={14} /> Téléphone
                </button>
              </div>
              {contactMode === 'email' ? (
                <Input type="email" placeholder="votre@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} disabled={loading}
                  className="h-11 text-sm rounded-xl border-gray-200 focus:border-blue-500" />
              ) : (
                <Input type="tel" placeholder="+221 77 000 00 00" value={telephone}
                  onChange={(e) => setTelephone(e.target.value)} disabled={loading}
                  className="h-11 text-sm rounded-xl border-gray-200 focus:border-blue-500" />
              )}
              {contactMode === 'telephone' && (
                <p className="text-xs text-amber-600">⚠ Sans email, la connexion se fera uniquement via l'administration.</p>
              )}
            </div>

            {/* Localisation prestataire */}
            {role === 'prestataire' && (
              <div className="space-y-1.5">
                <Label htmlFor="adresse" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <MapPin size={13} /> Localisation <span className="text-red-500">*</span>
                </Label>
                <Input id="adresse" type="text" placeholder="Ex : Rue 10, Médina, Dakar"
                  value={adresse} onChange={(e) => setAdresse(e.target.value)} required
                  className="h-11 text-sm rounded-xl border-gray-200 focus:border-blue-500" />
                <p className="text-xs text-gray-400">Adresse complète de votre établissement</p>
              </div>
            )}

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="h-11 text-sm rounded-xl border-gray-200 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400">Au moins 8 caractères, une majuscule et un chiffre</p>
            </div>

            {/* Confirmer mot de passe */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  className="h-11 text-sm rounded-xl border-gray-200 pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CGU */}
            <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
              <input id="cgAccepted" type="checkbox" checked={cgAccepted}
                onChange={(e) => setCgAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer flex-shrink-0" />
              <label htmlFor="cgAccepted" className="text-sm text-gray-700 cursor-pointer leading-snug">
                J'ai lu et j'accepte les{" "}
                <button type="button" onClick={() => navigate('/conditions-generales')}
                  className="text-blue-600 hover:underline font-semibold">
                  Conditions Générales d'Assurance
                </button>{" "}
                de Papy Services Assurances. <span className="text-red-500">*</span>
              </label>
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold"
              disabled={loading || !cgAccepted}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Création en cours...
                </span>
              ) : "Créer mon compte"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{" "}
              <button type="button" onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-semibold">
                Se connecter
              </button>
            </p>
            <button type="button" onClick={() => navigate('/')} className="text-xs text-gray-400 hover:text-blue-600 transition-colors">
              ← Retour à l'accueil
            </button>
          </div>
        </div>

        <p className="relative z-10 pb-6 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Papy Services Assurances. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
