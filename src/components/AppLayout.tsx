import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { UserMenu } from "./UserMenu";
import { Search, User, Stethoscope } from "lucide-react";
import { NotificationSystem } from "@/components/NotificationSystem";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataService } from "@/services/dataService";
import { AIChatbot } from "@/components/AIChatbot";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subHeader?: ReactNode;
}

interface SearchItem {
  type: "Assuré" | "Prestataire";
  label: string;
  subtitle: string;
  path: string;
  icon: React.ReactNode;
}

// Cache partagé entre toutes les instances du layout pour éviter les re-fetches
let _cachedAssures:      any[] | null = null;
let _cachedPrestataires: any[] | null = null;

export default function AppLayout({ children, title, subHeader }: AppLayoutProps) {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allItems,    setAllItems]    = useState<SearchItem[]>([]);

  // Charger les données une seule fois (avec cache)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!_cachedAssures) {
          _cachedAssures = await DataService.getAssures();
        }
        if (!_cachedPrestataires) {
          _cachedPrestataires = await DataService.getPrestataires();
        }
        if (!cancelled) {
          const items: SearchItem[] = [
            ...(_cachedAssures ?? []).map((a: any) => ({
              type:     "Assuré" as const,
              label:    [a.prenom, a.nom].filter(Boolean).join(' ') || '—',
              subtitle: a.numero ?? '',
              path:     `/assures/${a.id}`,
              icon:     <User size={16} />,
            })),
            ...(_cachedPrestataires ?? []).map((p: any) => ({
              type:     "Prestataire" as const,
              label:    p.nom ?? '—',
              subtitle: p.specialite ?? '',
              path:     '/prestataires',
              icon:     <Stethoscope size={16} />,
            })),
          ];
          setAllItems(items);
        }
      } catch {
        // Silencieux — la recherche reste vide
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Raccourci clavier Ctrl+K / ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen]);

  // Focus auto à l'ouverture
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  const filteredItems = searchQuery.trim()
    ? allItems.filter(item => {
        const q = searchQuery.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
      })
    : [];

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    setSearchOpen(false);
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <header className="h-10 sm:h-11 border-b border-border/40 bg-background/60 backdrop-blur-md flex items-center shrink-0 px-3 sm:px-5 gap-2 sm:gap-3">

          {/* Spacer for mobile menu button */}
          <div className="w-9 h-9 md:hidden flex-shrink-0" />

          {/* Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {title && (
              <h2 className="font-semibold text-sm truncate text-gray-900">
                {title}
              </h2>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Search — button desktop */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors"
            >
              <Search size={15} />
              <span className="hidden lg:inline text-sm">Rechercher…</span>
              <kbd className="hidden lg:inline text-[10px] font-mono bg-background border border-border rounded px-1.5 py-0.5 ml-1">
                Ctrl K
              </kbd>
            </button>
            {/* Search — icon mobile */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Rechercher"
            >
              <Search size={17} />
            </button>

            <NotificationSystem />
            <UserMenu />
          </div>
        </header>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto w-full">
            {subHeader && (
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b px-3 sm:px-5 lg:px-7 xl:px-8 py-2.5">
                {subHeader}
              </div>
            )}
            <div className="p-3 sm:p-5 lg:p-7 xl:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* ── Search dialog ──────────────────────────────────────────────── */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-base">Recherche rapide</DialogTitle>
          </DialogHeader>

          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Nom d'un assuré, prestataire…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="max-h-[380px] overflow-y-auto px-2 pb-3">
            {!searchQuery.trim() && (
              <p className="text-center text-muted-foreground text-sm py-10">
                Tapez pour rechercher…
              </p>
            )}
            {searchQuery.trim() && filteredItems.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-10">
                Aucun résultat pour «&nbsp;{searchQuery}&nbsp;»
              </p>
            )}
            {filteredItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item.path)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-muted transition-colors flex items-center gap-3 group"
              >
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.type}{item.subtitle ? ` • ${item.subtitle}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── AI Chatbot ─────────────────────────────────────────────────── */}
      <AIChatbot />
    </div>
  );
}
