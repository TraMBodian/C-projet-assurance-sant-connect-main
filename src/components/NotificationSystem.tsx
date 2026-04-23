import { Bell, Check, CheckCheck, AlertTriangle, UserCheck, ClipboardList, FileText, RefreshCw, WifiOff, Pill, CreditCard } from "@/components/ui/Icons";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/services/apiClient";
import { notificationStore, type LocalNotification } from "@/services/notificationStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawNotification {
  id:       string | number;
  type:     string;
  priority: "high" | "low";
  message:  string;
  detail:   string;
  link:     string;
  time:     string;
}

interface Notification extends RawNotification {
  id:   string;
  read: boolean;
}

// ─── Persistance readIds ──────────────────────────────────────────────────────

const READ_KEY = "notif_read_ids";

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch { /* ignorer */ }
}

// ─── Config icônes par type ───────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  sinistre:        { icon: <AlertTriangle size={14} />,  bg: "bg-orange-100",  color: "text-orange-600" },
  sinistre_recent: { icon: <FileText size={14} />,       bg: "bg-blue-100",    color: "text-blue-600"   },
  user:            { icon: <UserCheck size={14} />,      bg: "bg-purple-100",  color: "text-purple-600" },
  consultation:    { icon: <ClipboardList size={14} />,  bg: "bg-teal-100",    color: "text-teal-600"   },
  prescription:    { icon: <Pill size={14} />,           bg: "bg-green-100",   color: "text-green-600"  },
  paiement:        { icon: <CreditCard size={14} />,     bg: "bg-red-100",     color: "text-red-600"    },
  default:         { icon: <Bell size={14} />,           bg: "bg-gray-100",    color: "text-gray-600"   },
};

const POLL_INTERVAL = 60_000; // 60 secondes

// ─── Component ────────────────────────────────────────────────────────────────

export const NotificationSystem = () => {
  const navigate  = useNavigate();
  const panelRef  = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isOpen,           setIsOpen]           = useState(false);
  const [rawNotifications, setRawNotifications] = useState<RawNotification[]>([]);
  const [localNotifs,      setLocalNotifs]      = useState<LocalNotification[]>(() => notificationStore.getAll());
  const [loading,          setLoading]          = useState(false);
  const [backendDown,      setBackendDown]      = useState(false);
  // readIds chargés depuis localStorage au démarrage
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds);

  // ── Notifications calculées (fusion API + locales + état lu) ────────────────
  const notifications = useMemo<Notification[]>(() => {
    const apiNotifs: Notification[] = rawNotifications.map(n => ({
      ...n,
      id:   String(n.id),
      read: readIds.has(String(n.id)),
    }));
    const local: Notification[] = localNotifs.map(n => ({
      ...n,
      read: readIds.has(n.id),
    }));
    // Dédoublonnage par id, locales en premier (plus récentes)
    const seen = new Set<string>();
    return [...local, ...apiNotifs].filter(n => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [rawNotifications, localNotifs, readIds]);

  // ── Fetch indépendant de readIds — pas besoin de redémarrer le polling ──────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await apiClient.getNotifications();
      setRawNotifications(Array.isArray(raw) ? raw : []);
      setBackendDown(false);
    } catch {
      setBackendDown(true);
      // Garde les données précédentes sans les effacer
    } finally {
      setLoading(false);
    }
  }, []); // aucune dépendance — stable pour tout le cycle de vie

  // Chargement initial + polling toutes les 60 secondes
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Écoute les événements de notification locale (consultation, prescription…)
  useEffect(() => {
    const handler = () => setLocalNotifs(notificationStore.getAll());
    window.addEventListener("cnart_notif_update", handler);
    return () => window.removeEventListener("cnart_notif_update", handler);
  }, []);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current  && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Helpers mise à jour readIds avec persistance ──────────────────────────
  const updateReadIds = (updater: (prev: Set<string>) => Set<string>) => {
    setReadIds(prev => {
      const next = updater(prev);
      saveReadIds(next);
      return next;
    });
  };

  const markRead = (id: string) =>
    updateReadIds(prev => new Set([...prev, id]));

  const markAllRead = () =>
    updateReadIds(() => new Set(notifications.map(n => n.id)));

  const handleClick = (n: Notification) => {
    markRead(n.id);
    setIsOpen(false);
    navigate(n.link);
  };

  // ── Computed ──────────────────────────────────────────────────────────────
  const unread       = notifications.filter(n => !n.read).length;
  const highPriority = notifications.filter(n => n.priority === "high" && !n.read).length;
  const sorted       = [...notifications].sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (b.priority === "high" && a.priority !== "high") return  1;
    return 0;
  });

  return (
    <div className="relative">

      {/* ── Bell button ──────────────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(o => !o)}
        className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${
            highPriority > 0 ? "bg-red-500 animate-pulse" : "bg-blue-500"
          }`}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* ── Panel ────────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 w-[340px] max-w-[90vw] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
              {unread > 0 && (
                <span className="text-xs font-medium bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unread} non lue{unread > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchNotifications}
                title="Actualiser"
                className={`p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors ${loading ? "animate-spin" : ""}`}
              >
                <RefreshCw size={13} />
              </button>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  title="Tout marquer comme lu"
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
                >
                  <CheckCheck size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Bannière backend indisponible */}
          {backendDown && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
              <WifiOff size={12} className="shrink-0" />
              <span>Serveur indisponible — dernières données connues affichées</span>
            </div>
          )}

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                {backendDown ? (
                  <>
                    <WifiOff size={28} className="opacity-30" />
                    <p className="text-sm">Connexion au serveur perdue</p>
                    <button
                      onClick={fetchNotifications}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      <RefreshCw size={11} /> Réessayer
                    </button>
                  </>
                ) : (
                  <>
                    <Bell size={28} className="opacity-30" />
                    <p className="text-sm">Aucune notification</p>
                    <p className="text-xs opacity-70">Tout est à jour ✓</p>
                  </>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {sorted.map(n => {
                  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default;
                  return (
                    <li
                      key={n.id}
                      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        n.read
                          ? "hover:bg-muted/50"
                          : n.priority === "high"
                            ? "bg-orange-50/60 hover:bg-orange-50"
                            : "bg-blue-50/40 hover:bg-blue-50/60"
                      }`}
                      onClick={() => handleClick(n)}
                    >
                      {/* Icône type */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${n.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>
                          {n.message}
                        </p>
                        {n.detail && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.detail}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                      </div>

                      {/* Dot non-lu + bouton lu */}
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        {!n.read && (
                          <>
                            <span className={`w-2 h-2 rounded-full mt-1 ${n.priority === "high" ? "bg-red-500" : "bg-blue-500"}`} />
                            <button
                              onClick={e => { e.stopPropagation(); markRead(n.id); }}
                              title="Marquer comme lu"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-foreground transition-all"
                            >
                              <Check size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {sorted.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                {backendDown
                  ? "Serveur indisponible · cliquez ↺ pour réessayer"
                  : "Actualisé toutes les 60 secondes"
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
