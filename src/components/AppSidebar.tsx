import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Shield, FileText, CreditCard,
  Stethoscope, Pill, ClipboardList, ChevronDown, ChevronRight,
  Menu, X, LogOut, Banknote, BarChart2, Archive, MessageCircle, RefreshCw, Calendar, User, Heart, ShieldCheck,
} from "@/components/ui/Icons";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavChild {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavChild[];
}

// ─── Navigation configs ───────────────────────────────────────────────────────

const adminNavItems: NavItem[] = [
  { label: "Tableau de bord", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
  {
    label: "Statistiques & Analyses",
    icon: <BarChart2 size={18} />,
    children: [
      { label: "Statistiques",        path: "/admin/statistiques" },
      { label: "Tableau de bord financier", path: "/admin/financier" },
    ],
  },
  {
    label: "Production",
    icon: <Shield size={18} />,
    children: [
      { label: "Propositions",    path: "/admin/propositions" },
      { label: "Polices",         path: "/polices" },
      { label: "Maladie Famille", path: "/admin/maladie-famille" },
      { label: "Maladie Groupe",  path: "/admin/maladie-groupe" },
    ],
  },
  {
    label: "Membres",
    icon: <Users size={18} />,
    children: [
      { label: "Assurés",        path: "/admin/assures" },
      { label: "Utilisateurs",   path: "/admin/users" },
      { label: "Prestataires",   path: "/admin/prestataires" },
      { label: "Professionnels", path: "/professionnels-sante" },
    ],
  },
  {
    label: "Activité médicale",
    icon: <ClipboardList size={18} />,
    children: [
      { label: "Prestations",    path: "/prestations" },
      { label: "Consultations",  path: "/consultations" },
      { label: "Prescriptions",  path: "/prescriptions" },
    ],
  },
  {
    label: "Sinistres",
    icon: <FileText size={18} />,
    children: [
      { label: "Liste sinistres", path: "/sinistres" },
      { label: "Remboursements",  path: "/remboursements" },
    ],
  },
  {
    label: "Gestion financière",
    icon: <Banknote size={18} />,
    children: [
      { label: "Paiements primes",  path: "/paiements-primes" },
      { label: "Demandes contrat",  path: "/demandes-contrat" },
      { label: "Avenants contrat",  path: "/avenants-contrat" },
      { label: "Cartes",            path: "/cartes" },
    ],
  },
  { label: "Messagerie",     icon: <MessageCircle size={18} />, path: "/chat" },
  { label: "Archives",       icon: <Archive size={18} />,       path: "/admin/archives" },
  { label: "Journal d'audit", icon: <ShieldCheck size={18} />,  path: "/admin/audit-logs" },
];

const prestataireNavItems: NavItem[] = [
  { label: "Tableau de bord",  icon: <LayoutDashboard size={18} />, path: "/dashboard" },
  { label: "Statistiques",     icon: <BarChart2 size={18} />,       path: "/prestataire-dashboard" },
  { label: "Agenda",           icon: <Calendar size={18} />,        path: "/agenda" },
  { label: "Mes Patients",     icon: <Users size={18} />,           path: "/mes-patients" },
  { label: "Consultations",    icon: <ClipboardList size={18} />,   path: "/consultations" },
  { label: "Prescriptions",    icon: <Pill size={18} />,            path: "/prescriptions" },
  { label: "Prestations",      icon: <Pill size={18} />,            path: "/prestations" },
  { label: "Messagerie",       icon: <MessageCircle size={18} />,   path: "/chat" },
  { label: "Mon Profil",       icon: <User size={18} />,            path: "/profil-prestataire" },
];

const clientNavItems: NavItem[] = [
  { label: "Tableau de bord",          icon: <LayoutDashboard size={18} />, path: "/dashboard" },
  { label: "Mes Polices",              icon: <Shield size={18} />,          path: "/polices" },
  { label: "Mes Bénéficiaires",        icon: <Users size={18} />,           path: "/beneficiaires" },
  { label: "Mes Paiements",            icon: <Banknote size={18} />,        path: "/paiements-primes" },
  { label: "Mes Demandes",             icon: <RefreshCw size={18} />,       path: "/demandes-contrat" },
  { label: "Mes Avenants",             icon: <FileText size={18} />,        path: "/avenants-contrat" },
  { label: "Mes Sinistres",            icon: <FileText size={18} />,        path: "/sinistres" },
  { label: "Remboursements",           icon: <Banknote size={18} />,        path: "/remboursements" },
  { label: "Ma Carte",                 icon: <CreditCard size={18} />,      path: "/cartes" },
  { label: "Mes Prescriptions",        icon: <Pill size={18} />,            path: "/prescriptions" },
  { label: "Mes Prestations",          icon: <Pill size={18} />,            path: "/prestations" },
  { label: "Professionnels de santé",  icon: <Stethoscope size={18} />,     path: "/professionnels-sante" },
  { label: "Mon Dossier Santé",         icon: <Heart size={18} />,           path: "/mon-dossier" },
  { label: "Messagerie",               icon: <MessageCircle size={18} />,   path: "/chat" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppSidebar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, signOut } = useAuth();

  const [collapsed,   setCollapsed]   = useState(true);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const defaultOpen = adminNavItems
    .filter(i => i.children?.some(c => c.path === location.pathname))
    .map(i => i.label);
  const [openMenus, setOpenMenus] = useState<string[]>(defaultOpen);

  const navItems = user?.role === 'prestataire' ? prestataireNavItems
    : user?.role === 'client'      ? clientNavItems
    : adminNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const isActive       = (path?: string)                   => path === location.pathname;
  const isChildActive  = (children?: NavChild[])           => children?.some(c => c.path === location.pathname) ?? false;

  // ── Shared sidebar DOM ──────────────────────────────────────────────────
  const sidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">

      {/* Logo + collapse toggle */}
      <div className="flex items-center border-b border-sidebar-border">
        <button
          onClick={() => navigate("/")}
          className={`flex items-center gap-3 px-4 py-5 flex-1 hover:bg-sidebar-accent transition-colors text-left min-w-0 ${collapsed && !isMobile ? 'justify-center px-0' : ''}`}
        >
          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-white">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <h1 className="font-display text-base font-bold text-blue-600 leading-tight">
                Papy Services
              </h1>
              <p className="text-[10px] text-sidebar-muted leading-tight">Assurances</p>
            </div>
          )}
        </button>


        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 mr-3 rounded-md text-sidebar-muted hover:text-sidebar-foreground"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navItems.map(item =>
          item.children ? (
            <div key={item.label}>
              <button
                onClick={() => { if (!collapsed || isMobile) toggleMenu(item.label); }}
                title={collapsed && !isMobile ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  isChildActive(item.children)
                    ? "text-white bg-brand"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${collapsed && !isMobile ? 'justify-center' : ''}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {(!collapsed || isMobile) && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {openMenus.includes(item.label)
                      ? <ChevronDown size={14} className="flex-shrink-0" />
                      : <ChevronRight size={14} className="flex-shrink-0" />
                    }
                  </>
                )}
              </button>

              <AnimatePresence>
                {openMenus.includes(item.label) && (!collapsed || isMobile) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-8 mt-0.5 space-y-0.5 mb-1">
                      {item.children.map(child => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-2 min-h-[40px] flex items-center rounded-md text-sm transition-colors ${
                            isActive(child.path)
                              ? "text-white bg-brand font-medium"
                              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              key={item.path}
              to={item.path!}
              onClick={() => setMobileOpen(false)}
              title={collapsed && !isMobile ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "text-white bg-brand"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              } ${collapsed && !isMobile ? 'justify-center' : ''}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
            </Link>
          )
        )}
      </nav>

      {/* Footer - toujours visible */}
      <div className={`border-t border-sidebar-border py-3 ${collapsed && !isMobile ? 'px-2' : 'px-3'}`}>
        {!collapsed || isMobile ? (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={handleSignOut}
              title="Déconnexion"
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-2 left-2 z-40 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-card shadow-sm border border-border hover:bg-muted transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu size={18} />
      </button>

      {/* Overlay mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar mobile (slide-in) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[min(280px,82vw)] bg-sidebar z-50 md:hidden overflow-hidden"
          >
            {sidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar desktop — s'ouvre au survol, se referme quand la souris part */}
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        onClick={() => collapsed && setCollapsed(false)}
        className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border overflow-hidden transition-[width] duration-200 shrink-0 ${
          collapsed ? "w-[64px]" : "w-60 lg:w-64"
        }`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}
