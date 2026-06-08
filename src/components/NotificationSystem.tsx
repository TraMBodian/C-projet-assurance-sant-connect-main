import { Bell, Check, CheckCheck, AlertTriangle, UserCheck, ClipboardList, FileText, RefreshCw, WifiOff, Pill, CreditCard, Zap, Users, MessageCircle, UserPlus, Building2, CheckCircle2 } from "@/components/ui/Icons";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import { notificationStore, type LocalNotification } from "@/services/notificationStore";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import { CH, EV, type NotifPayload, getPusher } from "@/services/pusherService";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawNotification {
  id:            string | number;
  type:          string;
  priority:      "high" | "low";
  message:       string;
  detail:        string;
  link:          string;
  time:          string;
  targetRole?:   string;
  targetUserId?: string;
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
  consultation:    { icon: <ClipboardList size={14} />,  bg: "bg-blue-100",    color: "text-blue-600"   },
  prescription:    { icon: <Pill size={14} />,           bg: "bg-green-100",   color: "text-green-600"  },
  paiement:        { icon: <CreditCard size={14} />,     bg: "bg-red-100",     color: "text-red-600"    },
  famille:         { icon: <Users size={14} />,          bg: "bg-amber-100",   color: "text-amber-600"  },
  message:         { icon: <MessageCircle size={14} />,  bg: "bg-blue-100",    color: "text-blue-600"   },
  patient:         { icon: <UserPlus size={14} />,       bg: "bg-green-100",   color: "text-green-600"  },
  prestataire:     { icon: <Building2 size={14} />,      bg: "bg-purple-100",  color: "text-purple-600" },
  acceptation:     { icon: <CheckCircle2 size={14} />,   bg: "bg-green-100",   color: "text-green-600"  },
  default:         { icon: <Bell size={14} />,           bg: "bg-gray-100",    color: "text-gray-600"   },
};

// Polling ralenti à 5 min quand Pusher est actif, 60 s sinon
const POLL_INTERVAL_PUSHER = 5 * 60_000;
const POLL_INTERVAL_FALLBACK = 60_000;

// ─── Component ────────────────────────────────────────────────────────────────

function isVisibleToUser(
  n: { targetRole?: string; targetUserId?: string },
  role: string,
  userId: string,
): boolean {
  if (role === "admin") return true;                        // admin voit tout
  if (!n.targetRole) return true;                           // pas de restriction
  if (n.targetRole === "admin") return false;               // admin seulement
  if (n.targetRole !== role) return false;                  // mauvais rôle
  if (n.targetUserId && n.targetUserId !== userId) return false; // mauvais client
  return true;
}

export const NotificationSystem = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const panelRef  = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isOpen,           setIsOpen]           = useState(false);
  const [panelPos,         setPanelPos]         = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [rawNotifications, setRawNotifications] = useState<RawNotification[]>([]);
  const [localNotifs,      setLocalNotifs]      = useState<LocalNotification[]>(() => notificationStore.getAll());
  const [loading,          setLoading]          = useState(false);
  const [backendDown,      setBackendDown]      = useState(false);
  const [pusherLive,       setPusherLive]       = useState(false);
  // readIds chargés depuis localStorage au démarrage
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds);

  // ── Notifications calculées (fusion API + locales + filtrage par rôle) ──────
  const notifications = useMemo<Notification[]>(() => {
    const role   = user?.role   ?? "";
    const userId = user?.id     ?? "";

    const apiNotifs: Notification[] = rawNotifications
      .filter(n => isVisibleToUser(n, role, userId))
      .map(n => ({ ...n, id: String(n.id), read: readIds.has(String(n.id)) }));

    const local: Notification[] = localNotifs
      .filter(n => isVisibleToUser(n, role, userId))
      .map(n => ({ ...n, read: readIds.has(n.id) }));

    // Dédoublonnage par id, locales en premier (plus récentes)
    const seen = new Set<string>();
    return [...local, ...apiNotifs].filter(n => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  }, [rawNotifications, localNotifs, readIds, user?.role, user?.id]);

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

  // ── STOMP WebSocket : push temps-réel du backend (sans Pusher) ─────────────
  useRealtimeNotifications(user?.id, (n) => {
    const id = `stomp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setRawNotifications(prev => [{
      id,
      type:      n.type,
      priority:  (n.priority as "high" | "low") ?? "low",
      message:   n.message,
      detail:    "",
      link:      n.link ?? "/dashboard",
      time:      n.time ?? new Date().toLocaleTimeString("fr-FR"),
      targetRole: user?.role,
    }, ...prev]);
    fetchNotifications(); // rafraîchit aussi les notifs API
  });

  // ── Pusher : réception instantanée ─────────────────────────────────────────
  usePusherChannel(CH.notifications, {
    [EV.notification]: (data: unknown) => {
      const n = data as NotifPayload;
      setRawNotifications(prev => {
        if (prev.find(x => String(x.id) === String(n.id))) return prev;
        return [{ ...n, id: String(n.id) }, ...prev];
      });
    },
  });

  // Détecte si Pusher est connecté pour adapter l'intervalle de polling
  useEffect(() => {
    const pusher = getPusher();
    if (!pusher) return;
    const onConnected    = () => setPusherLive(true);
    const onDisconnected = () => setPusherLive(false);
    pusher.connection.bind('connected',    onConnected);
    pusher.connection.bind('disconnected', onDisconnected);
    pusher.connection.bind('failed',       onDisconnected);
    return () => {
      pusher.connection.unbind('connected',    onConnected);
      pusher.connection.unbind('disconnected', onDisconnected);
      pusher.connection.unbind('failed',       onDisconnected);
    };
  }, []);

  // Chargement initial + polling adaptatif (60 s sans Pusher, 5 min avec)
  useEffect(() => {
    fetchNotifications();
    const interval = pusherLive ? POLL_INTERVAL_PUSHER : POLL_INTERVAL_FALLBACK;
    const timer = setInterval(fetchNotifications, interval);
    return () => clearInterval(timer);
  }, [fetchNotifications, pusherLive]);

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

  const markRead = (id: string) => {
    updateReadIds(prev => new Set([...prev, id]));
    // Persister côté serveur si c'est une notif DB
    const notif = notifications.find(n => n.id === id);
    const dbId = (notif as any)?.dbId;
    if (dbId) apiClient.markNotificationRead(dbId).catch(() => {});
  };

  const markAllRead = () => {
    updateReadIds(() => new Set(notifications.map(n => n.id)));
    apiClient.markAllNotificationsRead().catch(() => {});
  };

  // Liens de secours si le backend renvoie un link vide
  const FALLBACK_LINKS: Record<string, string> = {
    famille:      "/admin/maladie-famille",
    sinistre:     "/sinistres",
    sinistre_recent: "/sinistres",
    consultation: "/consultations",
    prescription: "/prescriptions",
    paiement:     "/polices",
    patient:      "/admin/assures",
    user:         "/admin/assures",
    prestataire:  "/admin/prestataires",
    acceptation:  "/admin/propositions",
    message:      "/chat",
  };

  const handleClick = (n: Notification) => {
    markRead(n.id);
    setIsOpen(false);
    const destination = (n.link && n.link.trim() !== "" && n.link !== "#")
      ? n.link
      : (FALLBACK_LINKS[n.type] ?? "");
    if (destination) navigate(destination);
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
        onClick={() => {
          if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPanelPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
          }
          setIsOpen(o => !o);
        }}
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
          style={{ top: panelPos.top, right: panelPos.right }}
          className="fixed w-[340px] max-w-[90vw] bg-card border border-border rounded-xl shadow-xl z-[200] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
              {pusherLive && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                  <Zap size={9} />
                  Live
                </span>
              )}
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
                  : pusherLive
                    ? <span className="inline-flex items-center gap-1">Notifications en temps réel <Zap size={11} /></span>
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
