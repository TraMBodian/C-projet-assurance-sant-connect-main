import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Users, FileText, Activity, ArrowRight, CheckCircle2, Menu, Phone, Mail, MapPin, Star, TrendingUp, Clock, Award, Stethoscope } from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FeatureSection } from "@/components/FeatureSection";
// ─── Formulaire avis clients ─────────────────────────────────────────────────
const LABELS = ['', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent'];
function FeedbackForm() {
  const [avis, setAvis]   = useState({ nom: '', email: '', note: 0, message: '' });
  const [hover, setHover] = useState(0);
  const [sent, setSent]   = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setAvis(p => ({ ...p, [k]: e.target.value }));
  const active = hover || avis.note;
  return (
    <section className="py-24 mt-10 mx-4 relative z-[45] rounded-[50px] overflow-hidden bg-blue-600">
      {/* Cercles décoratifs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 max-w-xl relative z-10">
        <div className="text-center mb-10">
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">Témoignages</span>
          <h2 className="text-4xl font-bold text-white mb-3">Partagez votre expérience</h2>
          <p className="text-white/70 text-lg">Votre retour nous aide à progresser</p>
        </div>

        {sent ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Merci beaucoup !</h3>
            <p className="text-white/70 mb-6">Votre avis a bien été reçu.</p>
            <button onClick={() => { setSent(false); setAvis({ nom:'', email:'', note:0, message:'' }); }}
              className="text-sm text-white/70 hover:text-white transition-colors underline underline-offset-4">
              Laisser un autre avis
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl">
            <form onSubmit={e => { e.preventDefault(); if (avis.note === 0) return; setSent(true); }} className="space-y-6">

              {/* Étoiles */}
              <div className="text-center">
                <p className="text-white/80 text-sm mb-3">Votre note globale</p>
                <div className="flex justify-center gap-2 mb-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button"
                      onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                      onClick={() => setAvis(p => ({ ...p, note: n }))}
                      className="transition-transform hover:scale-110">
                      <Star className={`w-10 h-10 transition-all duration-150 ${n <= active ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' : 'text-white/30'}`} />
                    </button>
                  ))}
                </div>
                <p className={`text-sm font-semibold transition-all duration-200 ${active ? 'text-yellow-300' : 'text-white/40'}`}>
                  {active ? LABELS[active] : 'Cliquez pour noter'}
                </p>
              </div>

              {/* Champs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-white/70 text-xs mb-1.5 font-medium">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Nom *
                  </label>
                  <input value={avis.nom} onChange={set('nom')} placeholder="Votre nom" required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-white/70 text-xs mb-1.5 font-medium">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    Email *
                  </label>
                  <input type="email" value={avis.email} onChange={set('email')} placeholder="votre@email.com" required
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-white/70 text-xs mb-1.5 font-medium">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Votre message *
                </label>
                <textarea value={avis.message} onChange={set('message')} rows={4} placeholder="Décrivez votre expérience…" required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 resize-none" />
              </div>

              <button type="submit" disabled={avis.note === 0}
                className="w-full bg-white text-blue-700 font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
                <svg className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Envoyer mon avis
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Composant count-up ───────────────────────────────────────────────────────
function CountUp({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  const elRef    = useRef<HTMLSpanElement>(null);
  const started  = useRef(false);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let t0: number;
        const tick = (ts: number) => {
          if (!t0) t0 = ts;
          const p    = Math.min((ts - t0) / 1800, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(parseFloat((ease * to).toFixed(decimals)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, decimals]);
  return <span ref={elRef}>{decimals > 0 ? val.toFixed(decimals) : val}{suffix}</span>;
}

const Index = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const statsRef   = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });


  const slides = [
    {
      title: "Gérez vos assurances en toute simplicité",
      subtitle: "Une plateforme complète pour tous vos besoins d'assurance santé",
      gradient: "from-blue-900/80 to-blue-600/60",
      image: "/images/slide1.jpg"
    },
    {
      title: "Suivi en temps réel de vos sinistres",
      subtitle: "Traitez les demandes de remboursement rapidement et efficacement",
      gradient: "from-blue-900/80 to-blue-600/60",
      image: "/images/slide2.jpg"
    },
    {
      title: "Sécurité et conformité garanties",
      subtitle: "Vos données protégées selon les normes les plus strictes",
      gradient: "from-blue-900/80 to-blue-600/60",
      image: "/images/slide3.jpg"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const testimonials = [
    { name: "Marie Dubois", role: "Directrice RH", text: "Une solution exceptionnelle qui a transformé notre gestion d'assurance.", rating: 5 },
    { name: "Jean Martin", role: "Gérant d'entreprise", text: "Interface intuitive et support client réactif. Je recommande vivement!", rating: 5 },
    { name: "Sophie Laurent", role: "Responsable Santé", text: "Gain de temps considérable dans le traitement des dossiers.", rating: 5 }
  ];

  return (
    <div ref={scrollRef} className="min-h-screen" style={{ backgroundColor: '#E8F4F8', overflowY: 'auto', height: '100vh' }}>
      {/* Navbar */}
      <nav className="fixed z-[100] top-3 left-1/2 -translate-x-1/2 w-[min(860px,calc(100vw-2rem))] bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl transition-all duration-300">
        <div className="px-4 xl:px-5">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center group cursor-pointer shrink-0" onClick={() => navigate('/')}>
              <img src="/logo1.png" alt="Logo" className="h-11 w-auto object-contain group-hover:scale-105 transition-transform" />
            </div>

            <div className="hidden md:flex items-center gap-0.5">
              <a href="#features"    className="px-3 py-1.5 rounded-lg transition-all text-sm font-medium text-gray-800 hover:text-blue-600 hover:bg-white/40">Fonctionnalités</a>
              <a href="#testimonials" className="px-3 py-1.5 rounded-lg transition-all text-sm font-medium text-gray-800 hover:text-blue-600 hover:bg-white/40">Témoignages</a>
              <button onClick={() => navigate('/contact')} className="px-3 py-1.5 rounded-lg transition-all text-sm font-medium text-gray-800 hover:text-blue-600 hover:bg-white/40">Contact</button>
              <div className="w-px h-5 mx-1.5 bg-gray-300/60"></div>
              <button onClick={() => navigate('/login')} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-gray-800 hover:text-blue-600 hover:bg-white/40">Connexion</button>
              <button onClick={() => navigate('/login')} className="ml-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow hover:bg-blue-700 transition-colors whitespace-nowrap">Commencer</button>
            </div>

            <button className="md:hidden p-2 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-blue-100">
              <a href="#features" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors font-medium">Fonctionnalités</a>
              <a href="#testimonials" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors font-medium">Témoignages</a>
              <a href="#contact" className="block px-4 py-3 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors font-medium">Contact</a>
              <div className="border-t border-blue-100 my-2"></div>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full btn-ripple">Connexion</Button>
              <Button onClick={() => navigate('/login')} className="w-full">Commencer</Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Slider */}
      <div className="relative h-[600px] overflow-hidden pt-20">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="relative h-full">
              <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} opacity-85`}></div>
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="container mx-auto px-4 text-center">
                  <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in drop-shadow-lg">{slide.title}</h1>
                  <p className="text-base sm:text-xl md:text-2xl max-w-3xl mx-auto drop-shadow-md px-2">{slide.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Bouton fixe — ne bouge pas avec les slides */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm sm:text-base px-6 sm:px-10 py-3 rounded-full shadow-xl hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            Démarrer maintenant <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/50 w-2'}`}
            />
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 mt-8">
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, y: 40 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-blue-600 text-white py-12 rounded-3xl shadow-2xl"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-center mb-2"><TrendingUp className="w-8 h-8" /></div>
                <div className="text-4xl font-bold mb-1">{statsInView ? <CountUp to={10} suffix="K+" /> : "0"}</div>
                <div className="text-blue-100">Assurés actifs</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-center mb-2"><Clock className="w-8 h-8" /></div>
                <div className="text-4xl font-bold mb-1">24/7</div>
                <div className="text-blue-100">Support disponible</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-center mb-2"><Award className="w-8 h-8" /></div>
                <div className="text-4xl font-bold mb-1">{statsInView ? <CountUp to={99.9} suffix="%" decimals={1} /> : "0%"}</div>
                <div className="text-blue-100">Satisfaction client</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={statsInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
                <div className="flex items-center justify-center mb-2"><Shield className="w-8 h-8" /></div>
                <div className="text-4xl font-bold mb-1">{statsInView ? <CountUp to={100} suffix="%" /> : "0%"}</div>
                <div className="text-blue-100">Sécurisé</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section with Sticky Images */}
      <section id="features" className="relative z-20 scroll-mt-20">
        <FeatureSection
          icon={<Users className="w-4 h-4" />}
          badge="Gestion"
          badgeColor="bg-blue-100 text-blue-700"
          title="Gestion des Assurés"
          description="Gérez vos clients et bénéficiaires en toute simplicité. Centralisez toutes les informations, suivez l'historique médical, gérez les ayants-droit et accédez instantanément aux dossiers complets. Interface intuitive pour une gestion optimale de votre portefeuille clients."
          image="/images/feature1.jpg"
          imagePosition="right"
          bgColor="#F0F8FB"
        />
        
        <FeatureSection
          icon={<FileText className="w-4 h-4" />}
          badge="Contrats"
          badgeColor="bg-purple-100 text-purple-700"
          title="Polices d'Assurance"
          description="Créez et suivez vos contrats d'assurance santé. Générez automatiquement les polices, gérez les renouvellements, suivez les garanties et plafonds en temps réel. Personnalisez les couvertures selon les besoins spécifiques de chaque client."
          image="/images/feature2.jpg"
          imagePosition="left"
          bgColor="#E8F4F8"
        />
        
        <FeatureSection
          icon={<Activity className="w-4 h-4" />}
          badge="Sinistres"
          badgeColor="bg-orange-100 text-orange-700"
          title="Suivi des Sinistres"
          description="Traitez les demandes de remboursement efficacement. Workflow automatisé de validation, calcul intelligent des remboursements selon les garanties, notifications en temps réel et historique complet. Réduisez les délais de traitement de 70%."
          image="/images/feature3.jpg"
          imagePosition="right"
          bgColor="#F0F8FB"
        />
        
        <FeatureSection
          icon={<Shield className="w-4 h-4" />}
          badge="Sécurité"
          badgeColor="bg-emerald-100 text-emerald-700"
          title="Sécurité Optimale"
          description="Vos données protégées selon les normes les plus strictes. Conformité RGPD, chiffrement de bout en bout, sauvegardes automatiques quotidiennes, authentification multi-facteurs et traçabilité complète de toutes les opérations."
          image="/images/feature4.jpg"
          imagePosition="left"
          bgColor="#E8F4F8"
        />
      </section>

      {/* Benefits Section */}
      <section className="py-20 -mt-10 relative z-30 rounded-t-[50px]" style={{ backgroundColor: '#E8F4F8' }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Pourquoi choisir notre plateforme ?</h2>
              <div className="space-y-4">
                {[
                  "Interface intuitive et moderne",
                  "Gestion complète des polices et sinistres",
                  "Suivi en temps réel des remboursements",
                  "Cartes d'assurance avec QR Code",
                  "Rapports et analyses détaillés",
                  "Support client réactif 24/7"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <img src="/logo1.png" alt="Logo" className="w-32 h-32 object-contain mx-auto mb-4" />
                  <p className="text-2xl font-bold text-gray-800">Sécurité & Fiabilité</p>
                  <p className="text-gray-600 mt-2">Certifié et conforme</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 -mt-10 relative z-40 rounded-t-[50px] scroll-mt-20" style={{ backgroundColor: '#F0F8FB' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Témoignages</span>
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Ce que disent nos clients</h2>
            <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto mt-3" />
            <p className="text-xl text-gray-500 mt-4">Des milliers d'entreprises nous font confiance</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="p-8 border-none shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-blue-600">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-blue-600 text-blue-600" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire avis clients */}
      <FeedbackForm />

      {/* Registration CTA Section */}
      <section className="py-20 -mt-10 relative z-50 rounded-t-[50px]" style={{ backgroundColor: '#E8F4F8' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Rejoignez notre plateforme</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Créez votre compte en tant que prestataire ou client</p>
          </div>

          {/* Registration Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-3xl mx-auto">
            {/* Prestataire Card */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-brand">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-bl-full opacity-50"></div>
              <div className="relative p-8">
                <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Prestataire</h3>
                <p className="text-gray-600 mb-6">Fournissez vos services de santé et gériez vos consultations, prescriptions et remboursements.</p>
                <ul className="space-y-2 mb-8 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Gestion des consultations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Prescriptions simplifiées</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Suivi des remboursements</span>
                  </li>
                </ul>
                <Button onClick={() => navigate('/signup?role=prestataire')} className="w-full bg-brand hover:bg-brand-dark">
                  Créer un compte prestataire
                </Button>
              </div>
            </Card>

            {/* Client Card */}
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full opacity-50"></div>
              <div className="relative p-8">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Client</h3>
                <p className="text-gray-600 mb-6">Accédez à vos assurances, consultez vos sinistres et gérez vos remboursements facilement.</p>
                <ul className="space-y-2 mb-8 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Suivi des assurances</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Gestion des sinistres</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Accès aux cartes</span>
                  </li>
                </ul>
                <Button onClick={() => navigate('/signup?role=client')} className="w-full">
                  Créer un compte client
                </Button>
              </div>
            </Card>
          </div>

          {/* Already have account */}
          <div className="text-center">
            <p className="text-gray-600 text-lg">Vous avez déjà un compte?</p>
            <Button variant="link" onClick={() => navigate('/login')} className="mt-2 text-blue-600 text-lg">
              Se connecter maintenant
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-8 relative z-50 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo1.png" alt="Logo" className="w-10 h-10 object-contain flex-shrink-0" />
                <span className="text-lg font-bold text-white leading-tight">Papy Services<br/>Assurances</span>
              </div>
              <p className="text-gray-400">La solution complète pour gérer vos assurances santé avec efficacité.</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Liens rapides</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Témoignages</a></li>
                <li><button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">Dashboard</button></li>
                <li><button onClick={() => navigate('/polices')} className="hover:text-white transition-colors">Polices</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Informations légales</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate('/conditions-generales')} className="hover:text-white transition-colors text-left">
                    Conditions Générales
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+221 77 527 97 27</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>bassniang7@yahoo.fr</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Rufisque Ouest, Cité Poste, Lot N°67</span>
                </li>
                <li className="mt-2">
                  <button onClick={() => navigate('/contact')} className="text-blue-400 hover:text-white transition-colors text-sm font-medium">
                    → Formulaire de contact
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Suivez-nous</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-sky-500 transition-colors" aria-label="Twitter / X">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path fill="none" stroke="currentColor" strokeWidth="2" d="M2 2h20v20H2z" style={{display:"none"}}/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-current"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2"/></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 text-center text-gray-400">
            <p>&copy; 2024 Papy Services Assurances. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Index;
