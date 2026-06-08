import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/services/apiClient";
import { Send, Search } from "@/components/ui/Icons";

const BRAND = "#1B5299";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const WS_URL = API_BASE.replace("/api", "") + "/ws";

interface Msg  { id?: number; senderId: number; receiverId: number; content: string; senderName: string; createdAt: string; }
interface Contact { id: number; fullName: string; email: string; role: string; lastMessage?: string; unread: number; }

function roleBadge(role: string) {
  const map: Record<string, string> = { ADMIN: "bg-purple-100 text-purple-700", PRESTATAIRE: "bg-blue-100 text-blue-700", CLIENT: "bg-green-100 text-green-700" };
  const label: Record<string, string> = { ADMIN: "Admin", PRESTATAIRE: "Prestataire", CLIENT: "Client" };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${map[role] ?? "bg-gray-100 text-gray-600"}`}>{label[role] ?? role}</span>;
}

export default function ChatPage() {
  const { user } = useAuth();
  const myId = Number(user?.id);

  const [contacts,       setContacts]       = useState<Contact[]>([]);
  const [allUsers,       setAllUsers]       = useState<Contact[]>([]);
  const [activeContact,  setActiveContact]  = useState<Contact | null>(null);
  const [messages,       setMessages]       = useState<Msg[]>([]);
  const [input,          setInput]          = useState("");
  const [search,         setSearch]         = useState("");
  const [connected,      setConnected]      = useState(false);
  const stompRef   = useRef<Client | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);

  // Connexion WebSocket
  useEffect(() => {
    if (!myId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/user/${myId}/queue/messages`, (frame) => {
          const msg: Msg = JSON.parse(frame.body);
          setMessages(prev => [...prev, msg]);
          // Mettre à jour le dernier message du contact
          setContacts(prev => prev.map(c =>
            c.id === msg.senderId ? { ...c, lastMessage: msg.content, unread: c.unread + 1 } : c
          ));
        });
      },
      onDisconnect: () => setConnected(false),
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, [myId]);

  // Charger contacts et utilisateurs
  useEffect(() => {
    if (!myId) return;
    apiClient.request<Contact[]>(`/messages/contacts/${myId}`)
      .then(data => setContacts(Array.isArray(data) ? data : [])).catch(() => {});
    apiClient.request<Contact[]>(`/messages/users/${myId}`)
      .then(data => setAllUsers(Array.isArray(data) ? data : [])).catch(() => {});
  }, [myId]);

  // Scroll bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = useCallback((contact: Contact) => {
    setActiveContact(contact);
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread: 0 } : c));
    apiClient.request<Msg[]>(`/messages/conversation/${myId}/${contact.id}`)
      .then(data => setMessages(Array.isArray(data) ? data : [])).catch(() => setMessages([]));
    // Ajouter au contact list si pas déjà là
    setContacts(prev => prev.some(c => c.id === contact.id) ? prev : [{ ...contact, unread: 0 }, ...prev]);
  }, [myId]);

  const sendMessage = () => {
    if (!input.trim() || !activeContact) return;
    const payload = {
      senderId:    myId,
      receiverId:  activeContact.id,
      content:     input.trim(),
      senderName:  user?.full_name || user?.email || "Moi",
    };
    const optimistic: Msg = { ...payload, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setInput("");

    if (connected && stompRef.current) {
      stompRef.current.publish({ destination: "/app/chat.send", body: JSON.stringify(payload) });
    } else {
      // Fallback REST
      apiClient.request("/messages/send", { method: "POST", body: JSON.stringify(payload) }).catch(() => {});
    }
  };

  const displayedUsers = allUsers.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Messagerie">
      <div className="flex h-[calc(100vh-130px)] rounded-xl overflow-hidden border bg-white shadow-sm">

        {/* ── Sidebar contacts ─────────────────────── */}
        <div className="w-72 flex-shrink-0 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border bg-gray-50 text-sm">
              <Search size={13} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Chercher un utilisateur…"
                className="flex-1 bg-transparent outline-none text-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Conversations existantes */}
            {contacts.length > 0 && (
              <>
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Conversations</p>
                {contacts.map(c => (
                  <button key={c.id} onClick={() => openConversation(c)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors ${activeContact?.id === c.id ? "bg-blue-50 border-r-2 border-blue-600" : ""}`}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: BRAND }}>{(c.fullName?.[0] ?? "?").toUpperCase()}</div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate">{c.fullName}</p>
                      <p className="text-xs text-gray-400 truncate">{c.lastMessage ?? ""}</p>
                    </div>
                    {c.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{c.unread}</span>
                    )}
                  </button>
                ))}
              </>
            )}

            {/* Tous les utilisateurs */}
            {search && (
              <>
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Utilisateurs</p>
                {displayedUsers.map(u => (
                  <button key={u.id} onClick={() => openConversation(u)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors ${activeContact?.id === u.id ? "bg-blue-50 border-r-2 border-blue-600" : ""}`}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: BRAND }}>{(u.fullName?.[0] ?? "?").toUpperCase()}</div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold truncate">{u.fullName}</p>
                      <div className="flex items-center gap-1 mt-0.5">{roleBadge(u.role)}</div>
                    </div>
                  </button>
                ))}
                {displayedUsers.length === 0 && (
                  <p className="px-3 py-4 text-sm text-gray-400 text-center">Aucun résultat</p>
                )}
              </>
            )}

            {contacts.length === 0 && !search && (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm px-4 text-center">
                <p>Aucune conversation</p>
                <p className="text-xs mt-1">Recherchez un utilisateur pour démarrer</p>
              </div>
            )}
          </div>

          {/* Statut connexion */}
          <div className={`flex items-center gap-1.5 px-3 py-2 border-t text-xs ${connected ? "text-green-600" : "text-orange-500"}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-orange-400"}`} />
            {connected ? "Connecté en temps réel" : "Mode hors-ligne (REST)"}
          </div>
        </div>

        {/* ── Zone de conversation ──────────────────── */}
        {activeContact ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: BRAND }}>{(activeContact.fullName?.[0] ?? "?").toUpperCase()}</div>
              <div>
                <p className="font-semibold text-sm">{activeContact.fullName}</p>
                <p className="text-xs text-gray-400">{activeContact.email}</p>
              </div>
              {roleBadge(activeContact.role)}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => {
                const isMe = m.senderId === myId;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                      ? "text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-900 rounded-bl-sm"}`}
                      style={isMe ? { background: BRAND } : {}}>
                      {!isMe && <p className="text-[10px] font-semibold mb-0.5 opacity-70">{m.senderName}</p>}
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-0.5 ${isMe ? "text-white/60" : "text-gray-400"} text-right`}>
                        {new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                  <p>Aucun message</p>
                  <p className="text-xs mt-1">Envoyez le premier message !</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Écrire un message…"
                className="flex-1 px-4 py-2 rounded-full border text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button onClick={sendMessage} disabled={!input.trim()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                style={{ background: BRAND }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-16 h-16 opacity-20">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="font-medium">Sélectionnez une conversation</p>
            <p className="text-sm">ou recherchez un utilisateur dans la barre de gauche</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
