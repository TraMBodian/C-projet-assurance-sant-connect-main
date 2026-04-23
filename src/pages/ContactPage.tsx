import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, Menu, CheckCircle2 } from "@/components/ui/Icons";

export default function ContactPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
const [form, setForm]         = useState({ nom: "", email: "", telephone: "", sujet: "", message: "" });
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.email || !form.message) {
      toast({ title: "Champs requis", description: "Nom, email et message sont obligatoires.", variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
  };

  const infos = [
    {
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 14 19.79 19.79 0 0 1 1.08 5.41 2 2 0 0 1 3 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 17z"/></svg>,
      color: "bg-blue-600", label: "Téléphone", value: "+221 77 527 97 27", sub: "Lun – Ven, 8h – 18h"
    },
    {
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
      color: "bg-blue-600", label: "Email", value: "bassniang7@yahoo.fr", sub: "Réponse sous 24h"
    },
    {
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
      color: "bg-blue-600", label: "Adresse", value: "Rufisque Ouest, Cité Poste, Lot N°67", sub: "Dakar, Sénégal"
    },
    {
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      color: "bg-blue-600", label: "Horaires", value: "Lundi – Vendredi", sub: "8h00 – 18h00"
    },
  ];

  return (
    <div style={{ overflowY: "auto", height: "100vh" }}>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[min(860px,calc(100vw-2rem))] bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl h-12 flex items-center px-4">
        <div className="flex items-center justify-between w-full">
          <button onClick={() => navigate("/")} className="flex items-center">
            <img src="/logo1.png" alt="Logo" className="h-11 w-auto object-contain" />
          </button>
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => navigate("/#features")}     className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-800 hover:text-blue-600 hover:bg-white/40 transition-all">Fonctionnalités</button>
            <button onClick={() => navigate("/#testimonials")} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-800 hover:text-blue-600 hover:bg-white/40 transition-all">Témoignages</button>
            <button onClick={() => navigate("/contact")}       className="px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-white/40 transition-all">Contact</button>
            <div className="w-px h-5 mx-1 bg-white/40" />
            <Button onClick={() => navigate("/login")} variant="ghost" className="text-sm font-medium text-gray-800 hover:text-blue-600 hover:bg-white/40 h-8 px-3">Connexion</Button>
            <Button onClick={() => navigate("/login")} className="ml-1 h-8 px-3 text-sm">Commencer</Button>
          </div>
          <button className="md:hidden p-2 hover:bg-white/20 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu className="w-5 h-5 text-gray-800" />
          </button>
        </div>
        {mobileOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 px-4 space-y-1 md:hidden">
            <button onClick={() => navigate("/")} className="block w-full text-left px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-sm font-medium">Accueil</button>
            <button onClick={() => navigate("/conditions-generales")} className="block w-full text-left px-3 py-2.5 text-gray-700 hover:bg-blue-50 rounded-lg text-sm font-medium">Conditions Générales</button>
            <div className="border-t border-gray-100 my-1" />
            <Button onClick={() => navigate("/login")} variant="outline" className="w-full text-sm h-9">Connexion</Button>
            <Button onClick={() => navigate("/login")} className="w-full text-sm h-9">Commencer</Button>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="relative min-h-[420px] flex items-center justify-center overflow-hidden pt-20 bg-blue-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative text-center px-4 py-16">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Contactez-nous
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4">Nous sommes là pour vous</h1>
          <p className="text-white/70 text-xl max-w-xl mx-auto">Une question ? Un besoin ? Notre équipe répond dans les 24h.</p>
        </div>
      </div>

      {/* ── Infos + Formulaire ──────────────────────────────────────────────── */}
      <div className="bg-gray-50 relative z-10">
        <div className="max-w-6xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">

          {/* Colonne gauche : infos + carte */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nos coordonnées</h2>
              <p className="text-gray-500 mb-6">Plusieurs façons de nous joindre selon vos préférences.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {infos.map(({ icon, color, label, value, sub }) => (
                  <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white mb-3`}>
                      {icon}
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <p className="font-bold text-gray-900 text-sm mt-0.5 leading-snug">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Google Maps */}
            <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-100">
              <iframe
                title="Localisation Papy Services"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.5!2d-17.2788!3d14.7167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sRufisque+Ouest%2C+Dakar%2C+S%C3%A9n%C3%A9gal!5e0!3m2!1sfr!2ssn!4v1700000000000"
                width="100%" height="260" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="bg-white px-5 py-3 flex items-center gap-2 text-sm text-gray-600 border-t border-gray-100">
                <svg className="w-4 h-4 text-rose-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>Rufisque Ouest, Cité Poste, Lot N°67 — Dakar, Sénégal</span>
              </div>
            </div>
          </div>

          {/* Colonne droite : formulaire */}
          <div>
            {sent ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
                <p className="text-gray-500 mb-8">Nous vous répondrons dans les plus brefs délais.</p>
                <button onClick={() => { setSent(false); setForm({ nom:"", email:"", telephone:"", sujet:"", message:"" }); }}
                  className="text-sm text-blue-600 hover:underline">Envoyer un autre message</button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Envoyez-nous un message</h2>
                <p className="text-gray-500 text-sm mb-8">Remplissez le formulaire et nous vous répondrons rapidement.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Nom complet *</label>
                      <input value={form.nom} onChange={set("nom")} placeholder="Prénom Nom" required
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Email *</label>
                      <input type="email" value={form.email} onChange={set("email")} placeholder="votre@email.com" required
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Téléphone</label>
                      <input type="tel" value={form.telephone} onChange={set("telephone")} placeholder="+221 77 000 00 00"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Sujet</label>
                      <input value={form.sujet} onChange={set("sujet")} placeholder="Objet de votre demande"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Message *</label>
                    <textarea value={form.message} onChange={set("message")} rows={6} placeholder="Décrivez votre demande en détail…" required
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? "Envoi en cours…" : <><Send className="w-4 h-4" />Envoyer le message</>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer identique à l'accueil ────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo1.png" alt="Logo" className="w-10 h-10 object-contain flex-shrink-0" />
                <span className="text-lg font-bold text-white leading-tight">Papy Services<br />Assurances</span>
              </div>
              <p className="text-gray-400">La solution complète pour gérer vos assurances santé avec efficacité.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Liens rapides</h3>
              <ul className="space-y-2">
                <li><button onClick={() => navigate("/")} className="hover:text-white transition-colors">Accueil</button></li>
                <li><button onClick={() => navigate("/dashboard")} className="hover:text-white transition-colors">Dashboard</button></li>
                <li><button onClick={() => navigate("/polices")} className="hover:text-white transition-colors">Polices</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Informations légales</h3>
              <ul className="space-y-2">
                <li><button onClick={() => navigate("/conditions-generales")} className="hover:text-white transition-colors text-left">Conditions Générales</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 14 19.79 19.79 0 0 1 1.08 5.41 2 2 0 0 1 3 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 17z"/></svg><span>+221 77 527 97 27</span></li>
                <li className="flex items-center gap-2"><svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><span>bassniang7@yahoo.fr</span></li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>Rufisque Ouest, Cité Poste, Lot N°67</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Suivez-nous</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2024 Papy Services Assurances. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
