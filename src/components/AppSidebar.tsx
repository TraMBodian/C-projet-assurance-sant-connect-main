import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, UserCog, Shield, FileText, CreditCard,
  Stethoscope, Pill, ClipboardList, ChevronDown, ChevronRight,
  Menu, X, LogOut, Banknote, BarChart2, Archive,
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
  { label: "Statistiques",   icon: <BarChart2 size={18} />,       path: "/statistiques" },
  {
    label: "Production",
    icon: <Shield size={18} />,
    children: [
      { label: "Polices",         path: "/polices" },
      { label: "Maladie Famille", path: "/maladie-famille" },
      { label: "Maladie Groupe",  path: "/maladie-groupe" },
    ],
  },
  { label: "Assurés",        icon: <Users size={18} />,       path: "/assures" },
  { label: "Utilisateurs",   icon: <UserCog size={18} />,     path: "/users" },
  { label: "Prestataires",   icon: <Stethoscope size={18} />, path: "/prestataires" },
  {
    label: "Sinistres",
    icon: <FileText size={18} />,
    children: [
      { label: "Liste sinistres", path: "/sinistres" },
      { label: "Remboursements",  path: "/remboursements" },
    ],
  },
  { label: "Cartes",         icon: <CreditCard size={18} />,   path: "/cartes" },
  { label: "Consultations",  icon: <ClipboardList size={18} />, path: "/consultations" },
  { label: "Prescriptions",  icon: <Pill size={18} />,          path: "/prescriptions" },
  { label: "Archives",       icon: <Archive size={18} />,       path: "/archives" },
];

const prestataireNavItems: NavItem[] = [
  { label: "Tableau de bord", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
  { label: "Consultations",   icon: <ClipboardList size={18} />,   path: "/consultations" },
  { label: "Prescriptions",   icon: <Pill size={18} />,            path: "/prescriptions" },
  {
    label: "Sinistres",
    icon: <FileText size={18} />,
    children: [
      { label: "Liste sinistres", path: "/sinistres" },
      { label: "Remboursements",  path: "/remboursements" },
    ],
  },
];

const clientNavItems: NavItem[] = [
  { label: "Tableau de bord", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
  { label: "Mes Polices",      icon: <Shield size={18} />,          path: "/polices" },
  { label: "Mes Sinistres",    icon: <FileText size={18} />,        path: "/sinistres" },
  { label: "Remboursements",   icon: <Banknote size={18} />,        path: "/remboursements" },
  { label: "Ma Carte",         icon: <CreditCard size={18} />,      path: "/cartes" },
  { label: "Mes Prescriptions",icon: <Pill size={18} />,            path: "/prescriptions" },
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

  const roleLabel = user?.role === 'admin'       ? 'Administrateur'
    : user?.role === 'prestataire' ? 'Prestataire'
    : 'Client';

  const initials = (user?.full_name || user?.fullName || user?.email || 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

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
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isChildActive(item.children)
                    ? "text-white bg-blue-600"
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
                          className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                            isActive(child.path)
                              ? "text-white bg-blue-600 font-medium"
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
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "text-white bg-blue-600"
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
          <>
            <button
              onClick={() => navigate("/profile")}
              className="w-full flex items-center gap-3 mb-2 hover:bg-sidebar-accent rounded-lg p-2 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user?.full_name || user?.fullName || 'Utilisateur'}
                </p>
                <p className="text-[10px] text-sidebar-muted">{roleLabel}</p>
              </div>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              <span>Déconnexion</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => navigate("/profile")}
              title={user?.full_name || 'Profil'}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            >
              {initials}
            </button>
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
        className="md:hidden fixed top-2.5 left-2.5 sm:top-3 sm:left-3 z-40 p-2 rounded-lg bg-card shadow-sm border border-border hover:bg-muted transition-colors"
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
