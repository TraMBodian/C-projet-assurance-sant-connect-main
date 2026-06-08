import { motion } from "framer-motion";
import { Stethoscope, AlertCircle, Mail, Phone } from "@/components/ui/Icons";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";

export default function PrestataireOnboardingPage() {
  const { user, signOut } = useAuth();

  return (
    <AppLayout title="Bienvenue">
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full space-y-6 text-center px-4"
        >
          {/* Icône */}
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Stethoscope size={36} className="text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenue sur Papy Services</h1>
            <p className="text-muted-foreground mt-2">
              Bonjour {user?.full_name ?? user?.email ?? ""},
            </p>
          </div>

          {/* Alert */}
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4 text-left">
            <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-800">Compte en cours de configuration</p>
              <p className="text-orange-700 mt-1">
                Votre compte prestataire est créé, mais il n'est pas encore lié à un établissement de santé.
                Un administrateur doit effectuer cette association pour que vous puissiez accéder à toutes les fonctionnalités.
              </p>
            </div>
          </div>

          {/* Étapes */}
          <div className="bg-card border border-border rounded-xl p-5 text-left space-y-3">
            <h3 className="font-semibold text-sm text-gray-900">Prochaines étapes</h3>
            {[
              { n: "1", text: "Un administrateur associe votre compte à votre établissement" },
              { n: "2", text: "Vous recevrez une notification de confirmation" },
              { n: "3", text: "Vous pourrez alors accéder à vos consultations, prescriptions et agenda" },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {s.n}
                </div>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 flex flex-col gap-2">
            <p className="font-semibold">Besoin d'aide ?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:admin@papyservices.sn" className="flex items-center gap-1.5 hover:underline">
                <Mail size={14} /> admin@papyservices.sn
              </a>
              <a href="tel:+221331234567" className="flex items-center gap-1.5 hover:underline">
                <Phone size={14} /> +221 33 123 45 67
              </a>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Se déconnecter
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
