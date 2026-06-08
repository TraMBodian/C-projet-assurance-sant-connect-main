import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Shield, Users, FileText, Activity, ArrowRight, CheckCircle2, Menu, X,
  Phone, Mail, MapPin, Star, TrendingUp, Clock, Award, Stethoscope,
  ChevronDown, BarChart2,
} from "@/components/ui/Icons";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { FeatureSection } from "@/components/FeatureSection";

// ─── Données statiques marketing ─────────────────────────────────────────────
// Ces chiffres sont des indicateurs commerciaux, pas les stats live de la DB.
const MARKETING_STATS = [
  { icon: TrendingUp,  value: "500+",  label: "Assurés gérés",        suffix: "" },
  { icon: Stethoscope, value: "120+",  label: "Prestataires réseau",  suffix: "" },
  { icon: Award,       value: "98",    label: "Taux de satisfaction", suffix: "%" },
  { icon: Clock,       value: "48",    label: "Délai remboursement",  suffix: "h" },
];

// ─── Témoignages enrichis ─────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Aïssatou Diallo",
    role: "Directrice des Ressources Humaines",
    company: "Groupe Teranga SA",
    text: "Depuis que nous utilisons cette plateforme, la gestion de nos 200 assurés est devenue un jeu d'enfant. Gain de temps énorme et zéro dossier perdu.",
    rating: 5,
    initials: "AD",
    color: "bg-blue-600",
  },
  {
    name: "Mamadou Ndiaye",
    role: "Gérant",
    company: "Cabinet Médical Dakar Centre",
    text: "Interface claire, remboursements traités en moins de 48 h. Nos patients n'attendent plus. Le suivi en temps réel change tout.",
    rating: 4,
    initials: "MN",
    color: "bg-emerald-600",
  },
  {
    name: "Fatoumata Sow",
    role: "Responsable Santé & Prévoyance",
    company: "Banque Africaine de Commerce",
    text: "Le suivi en temps réel des sinistres a transformé notre façon de travailler. L'outil est fiable, rapide et le support toujours disponible.",
    rating: 5,
    initials: "FS",
    color: "bg-purple-600",
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Quel est le délai moyen de remboursement d'un sinistre ?",
    a: "Le délai moyen est de 48 heures ouvrées après validation du dossier complet. Notre workflow automatisé notifie l'assuré à chaque étape.",
  },
  {
    q: "Les données médicales sont-elles sécurisées ?",
    a: "Oui. Toutes les données sont chiffrées de bout en bout, hébergées sur des serveurs conformes aux normes locales et accessibles uniquement aux personnes autorisées. Nous appliquons les principes de la loi sénégalaise sur la protection des données personnelles.",
  },
  {
    q: "Puis-je gérer plusieurs polices famille et groupe ?",
    a: "Absolument. La plateforme gère les polices individuelles, familiales et de groupe avec des paramètres de garanties différenciés. Chaque membre bénéficie de sa propre carte d'assurance avec QR Code.",
  },
  {
    q: "Comment se passe l'intégration avec mon système existant ?",
    a: "Nous proposons une API REST documentée et des exports CSV/Excel. Notre équipe technique vous accompagne pendant toute la phase d'intégration, sans frais supplémentaires.",
  },
  {
    q: "Puis-je résilier à tout moment ?",
    a: "Oui, sans engagement à durée minimale pour les formules mensuelle. Un préavis de 30 jours est requis. Vos données vous sont restituées dans les 15 jours suivant la résiliation.",
  },
];

// ─── Étapes How it works ──────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Créez votre compte",
    desc: "Inscription en 2 minutes. Choisissez votre profil — prestataire de santé ou assuré — et renseignez vos informations.",
    color: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
  },
  {
    step: "02",
    icon: Shield,
    title: "Accédez à vos services",
    desc: "Prestataire : consultez vos patients, rédigez prescriptions et prestations. Assuré : retrouvez votre police, vos garanties et votre carte QR Code.",
    color: "bg-purple-100 text-purple-700",
    border: "border-purple-200",
  },
  {
    step: "03",
    icon: BarChart2,
    title: "Suivez en temps réel",
    desc: "Prestataire : tracez vos actes et remboursements. Assuré : déclarez un sinistre et suivez chaque étape jusqu'au paiement, avec alertes instantanées.",
    color: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
  },
];


// ─── Composant count-up ───────────────────────────────────────────────────────
function CountUp({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  const elRef   = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
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

// ─── Composant FAQ item ───────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? "border-blue-300 bg-blue-50/50" : "border-gray-200 bg-white"}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
      >
        <span className="font-semibold text-gray-900 text-sm sm:text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 text-blue-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-gray-600 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Liens NavBar (composant unique pour éviter la duplication) ───────────────
function NavLinks({
  scrolled,
  onSection,
  onNavigate,
  mobile = false,
  onClose,
}: {
  scrolled: boolean;
  onSection: (id: string) => void;
  onNavigate: (path: string) => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const base    = mobile
    ? "w-full text-left block px-4 py-2.5 rounded-lg transition-colors font-medium text-sm"
    : "px-3 py-1.5 rounded-lg transition-all text-sm font-medium";
  const color   = scrolled
    ? "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
    : mobile
      ? "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
      : "text-white/90 hover:text-white hover:bg-white/20";

  const go = (fn: () => void) => { fn(); onClose?.(); };

  return (
    <>
      <button onClick={() => go(() => onSection("how-it-works"))} className={`${base} ${color}`}>Comment ça marche</button>
      <button onClick={() => go(() => onSection("features"))}     className={`${base} ${color}`}>Fonctionnalités</button>
      <button onClick={() => go(() => onSection("testimonials"))} className={`${base} ${color}`}>Témoignages</button>
      <button onClick={() => go(() => onNavigate("/contact"))}    className={`${base} ${color}`}>Contact</button>
      {mobile ? (
        <>
          <div className={`border-t my-2 ${scrolled ? "border-gray-100" : "border-gray-100"}`} />
          <Button onClick={() => go(() => onNavigate("/login"))} variant="outline" className="w-full">Connexion</Button>
          <Button onClick={() => go(() => onNavigate("/login"))} className="w-full bg-blue-600 hover:bg-blue-700 mt-1">Commencer</Button>
        </>
      ) : (
        <>
          <div className="w-px h-5 mx-1.5 bg-white/30" style={{ background: scrolled ? "#e5e7eb" : undefined }} />
          <button onClick={() => onNavigate("/login")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${scrolled ? "text-gray-700 hover:text-blue-600 hover:bg-blue-50" : "text-white/90 hover:text-white hover:bg-white/20"}`}>
            Connexion
          </button>
          <button onClick={() => onNavigate("/login")}
            className={`ml-1.5 px-4 py-1.5 text-sm font-semibold rounded-xl shadow transition-colors whitespace-nowrap ${scrolled ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white text-blue-700 hover:bg-blue-50"}`}>
            Commencer
          </button>
        </>
      )}
    </>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
const Index = () => {
  const navigate = useNavigate();
  const [currentSlide,   setCurrentSlide]   = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navScrolled,    setNavScrolled]    = useState(false);

  // html/body ont overflow:hidden (requis par les pages avec sidebar).
  // La page d'accueil est donc son propre conteneur de scroll.
  const scrollRef = useRef<HTMLDivElement>(null);

  const statsRef    = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const container = scrollRef.current;
    const el = document.getElementById(id);
    if (container && el) {
      container.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setNavScrolled(el.scrollTop > 80);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const slides = [
    {
      title: "Gérez vos assurances en toute simplicité",
      subtitle: "Une plateforme complète pour tous vos besoins d'assurance santé",
      gradient: "from-blue-900/85 to-blue-700/65",
      image: "/images/slide1.jpg",
    },
    {
      title: "Suivi en temps réel de vos sinistres",
      subtitle: "Traitez les demandes de remboursement rapidement et efficacement",
      gradient: "from-slate-900/85 to-blue-800/65",
      image: "/images/slide2.jpg",
    },
    {
      title: "Sécurité et conformité garanties",
      subtitle: "Vos données protégées selon les normes les plus strictes",
      gradient: "from-blue-950/85 to-indigo-700/65",
      image: "/images/slide3.jpg",
    },
  ];

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div ref={scrollRef} className="min-h-screen bg-[#E8F4F8]" style={{ height: "100vh", overflowY: "auto" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className={`fixed z-[100] top-3 left-1/2 -translate-x-1/2 w-[min(920px,calc(100vw-2rem))] backdrop-blur-md border rounded-2xl transition-all duration-300 ${
        navScrolled ? "bg-white/98 border-gray-200 shadow-lg" : "bg-white/15 border-white/30"
      }`}>
        <div className="px-4 xl:px-5">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate("/")} className="flex items-center group shrink-0">
              <img src="/logo1.png" alt="Logo Papy Services Assurances" className="h-11 w-auto object-contain group-hover:scale-105 transition-transform" />
            </button>

            <div className="hidden md:flex items-center gap-0.5">
              <NavLinks scrolled={navScrolled} onSection={scrollToSection} onNavigate={navigate} />
            </div>

            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${navScrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/20"}`}
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`md:hidden overflow-hidden py-3 space-y-1 border-t ${navScrolled ? "border-gray-100" : "border-white/20"}`}
              >
                <NavLinks
                  scrolled={true}
                  onSection={scrollToSection}
                  onNavigate={navigate}
                  mobile
                  onClose={() => setMobileMenuOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* ── Hero Slider ──────────────────────────────────────────────────────── */}
      <div className="relative h-[600px] overflow-hidden pt-20">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? "opacity-100" : "opacity-0"}`}
          >
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="container mx-auto px-4 text-center">
                <motion.h1
                  key={`title-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: idx === currentSlide ? 1 : 0, y: idx === currentSlide ? 0 : 20 }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 drop-shadow-lg"
                >
                  {slide.title}
                </motion.h1>
                <p className="text-base sm:text-xl md:text-2xl max-w-3xl mx-auto drop-shadow-md px-2 text-white/90">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* CTAs héro */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm sm:text-base px-6 sm:px-9 py-3 rounded-full shadow-xl hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Démarrer maintenant <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="flex items-center gap-2 bg-white/15 border border-white/40 text-white font-semibold text-sm sm:text-base px-6 sm:px-9 py-3 rounded-full hover:bg-white/25 transition-colors whitespace-nowrap backdrop-blur-sm"
          >
            Voir comment ça marche
          </button>
        </div>

        {/* Indicateurs slides */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${idx === currentSlide ? "bg-white w-8" : "bg-white/50 w-2"}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Stats Bar (chiffres marketing statiques) ─────────────────────────── */}
      <div className="container mx-auto px-4 mt-8 max-w-5xl" ref={statsRef}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-blue-600 text-white py-6 px-6 rounded-2xl shadow-2xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {MARKETING_STATS.map(({ icon: Icon, value, label, suffix }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * (i + 1) }}
              >
                <div className="flex items-center justify-center mb-1">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-bold mb-0.5">
                  {statsInView
                    ? <CountUp to={parseInt(value.replace("+", "").replace("%", ""))} suffix={value.includes("+") ? "+" : suffix} />
                    : "0"}
                </div>
                <div className="text-blue-100 text-xs">{label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Comment ça marche ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 scroll-mt-24">
        <div className="container mx-auto px-6 md:px-10 max-w-5xl">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Démarrage rapide</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Comment ça marche ?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Opérationnel en moins d'une journée. Aucune installation logicielle requise.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Ligne de connexion desktop */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200" style={{ left: "16.5%", right: "16.5%" }} />
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color, border }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.15 }}
                className={`relative bg-white rounded-2xl border ${border} p-6 shadow-sm hover:shadow-md transition-shadow text-center`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${color} mb-4 mx-auto`}>
                  <Icon size={28} />
                </div>
                <div className="absolute -top-3 -right-3 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────────────── */}
      <section id="features" className="relative z-20 scroll-mt-24">
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

      {/* ── Benefits ────────────────────────────────────────────────────────── */}
      <section className="py-20 mt-6 relative z-30 rounded-t-[50px] bg-[#E8F4F8]">
        <div className="container mx-auto px-6 md:px-10 max-w-4xl">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Avantages</span>
            <h2 className="text-3xl sm:text-4xl font-bold">Pourquoi choisir notre plateforme ?</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                text: "Interface intuitive, prise en main en moins d'une heure",
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
              },
              {
                text: "Cartes d'assurance avec QR Code vérifiable instantanément",
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
              },
              {
                text: "Suivi des sinistres et remboursements étape par étape",
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              },
              {
                text: "Rapports et analyses exportables (CSV, PDF)",
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
              },
              {
                text: "Consultations, prescriptions et prestations centralisées",
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
              },
              {
                text: "Hébergement sécurisé, conformité CDP Sénégal",
                svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
              },
            ].map(({ text, svg }, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                  {svg}
                </div>
                <span className="text-sm text-gray-700 leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Témoignages ─────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-16 relative z-40 rounded-t-[50px] scroll-mt-24 bg-[#F0F8FB]">
        <div className="container mx-auto px-6 md:px-10">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">Témoignages</span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">Ce que disent nos clients</h2>
            <div className="w-12 h-1 bg-blue-600 rounded-full mx-auto mt-3" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, role, company, text, rating, initials, color }) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
              >
                <Card className="p-6 border-none shadow-lg hover:shadow-xl transition-shadow h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 italic text-sm leading-relaxed flex-1">"{text}"</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
                    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{name}</p>
                      <p className="text-xs text-gray-400">{role}</p>
                      <p className="text-xs text-blue-600 font-medium">{company}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 bg-white relative z-45">
        <div className="container mx-auto px-6 md:px-10 max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Questions fréquentes</h2>
            <p className="text-gray-500">Vous ne trouvez pas la réponse ?{" "}
              <button onClick={() => navigate("/contact")} className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
                Contactez-nous
              </button>
            </p>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Inscription ─────────────────────────────────────────────────── */}
      <section className="py-20 relative z-50 rounded-t-[50px] bg-[#E8F4F8]">
        <div className="container mx-auto px-6 md:px-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900">Rejoignez notre plateforme</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Créez votre compte en tant que prestataire de santé ou assuré</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-10">
            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-bl-full opacity-50" />
              <div className="relative p-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Prestataire</h3>
                <p className="text-gray-600 mb-6 text-sm">Fournissez vos services de santé et gérez vos consultations, prescriptions et remboursements.</p>
                <ul className="space-y-2 mb-8 text-sm text-gray-700">
                  {["Gestion des consultations", "Prescriptions simplifiées", "Suivi des remboursements"].map(f => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />{f}</li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/signup?role=prestataire")} className="w-full bg-blue-600 hover:bg-blue-700">
                  Créer un compte prestataire
                </Button>
              </div>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-bl-full opacity-50" />
              <div className="relative p-8">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Client / Assuré</h3>
                <p className="text-gray-600 mb-6 text-sm">Accédez à vos assurances, consultez vos sinistres et gérez vos remboursements facilement.</p>
                <ul className="space-y-2 mb-8 text-sm text-gray-700">
                  {["Suivi de vos assurances", "Gestion des sinistres", "Carte d'assuré avec QR Code"].map(f => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />{f}</li>
                  ))}
                </ul>
                <Button onClick={() => navigate("/signup?role=client")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Créer un compte client
                </Button>
              </div>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-600">Vous avez déjà un compte ?{" "}
              <button onClick={() => navigate("/login")} className="text-blue-600 font-semibold hover:underline">
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-10 relative z-50 scroll-mt-20">
        <div className="container mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            {/* Identité */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo1.png" alt="Logo" className="w-10 h-10 object-contain flex-shrink-0" />
                <span className="text-lg font-bold text-white leading-tight">Papy Services<br />Assurances</span>
              </div>
              <p className="text-gray-400 text-sm">La solution complète pour gérer vos assurances santé avec efficacité et conformité.</p>
            </div>

            {/* Liens rapides — uniquement pages publiques */}
            <div>
              <h3 className="text-white font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection("how-it-works")} className="hover:text-white transition-colors">Comment ça marche</button></li>
                <li><button onClick={() => scrollToSection("features")}     className="hover:text-white transition-colors">Fonctionnalités</button></li>
                <li><button onClick={() => scrollToSection("testimonials")} className="hover:text-white transition-colors">Témoignages</button></li>
                <li><button onClick={() => scrollToSection("faq")}          className="hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>

            {/* Informations légales */}
            <div>
              <h3 className="text-white font-semibold mb-4">Informations légales</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate("/conditions-generales")} className="hover:text-white transition-colors text-left">Conditions Générales</button></li>
                <li><button onClick={() => navigate("/politique-confidentialite")} className="hover:text-white transition-colors text-left">Politique de confidentialité</button></li>
                <li><button onClick={() => navigate("/mentions-legales")} className="hover:text-white transition-colors text-left">Mentions légales</button></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <a href="tel:+221775279727" className="hover:text-white transition-colors">+221 77 527 97 27</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <a href="mailto:bassniang7@yahoo.fr" className="hover:text-white transition-colors">bassniang7@yahoo.fr</a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Rufisque Ouest, Cité Poste, Lot N°67</span>
                </li>
                <li className="mt-2">
                  <button onClick={() => navigate("/contact")} className="text-blue-400 hover:text-white transition-colors font-medium">
                    → Formulaire de contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Réseaux sociaux — liens réels ou retirés si non renseignés */}
            <div>
              <h3 className="text-white font-semibold mb-4">Suivez-nous</h3>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              </div>
              <p className="text-gray-500 text-xs mt-3">Prochainement sur d'autres réseaux</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Papy Services Assurances. Tous droits réservés.</p>
            <p>Conforme à la loi sénégalaise sur la protection des données personnelles (CDP)</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Index;
