import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { apiClient } from "@/services/apiClient";

export interface RealtimeNotification {
  id?: string;
  dbId?: number;
  type: string;
  message: string;
  link?: string;
  priority?: "low" | "medium" | "high";
  time?: string;
  read?: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const WS_URL = API_BASE.replace(/\/api$/, "") + "/ws";

/**
 * Souscrit au canal STOMP /user/{userId}/queue/notifications.
 * Envoie le JWT dans le header Authorization du frame CONNECT.
 */
export function useRealtimeNotifications(
  userId: number | string | undefined,
  onNotification: (n: RealtimeNotification) => void
) {
  const clientRef = useRef<Client | null>(null);
  const cbRef     = useRef(onNotification);
  cbRef.current = onNotification;

  useEffect(() => {
    if (!userId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      reconnectDelay: 15000,
      // JWT envoyé dans le header CONNECT pour authentifier la connexion WebSocket
      connectHeaders: {
        Authorization: apiClient.getToken() ? `Bearer ${apiClient.getToken()}` : "",
      },
      onConnect: () => {
        client.subscribe(`/user/${userId}/queue/notifications`, (frame) => {
          try {
            const notif: RealtimeNotification = JSON.parse(frame.body);
            cbRef.current(notif);
          } catch {
            // ignore malformed frames
          }
        });
      },
      onStompError: (frame) => {
        console.warn("STOMP error:", frame.headers?.message);
      },
      onDisconnect: () => {
        // Reconnexion automatique gérée par reconnectDelay
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [userId]);
}
