import Pusher from 'pusher-js';
import { apiClient } from '@/services/apiClient';

const KEY     = import.meta.env.VITE_PUSHER_APP_KEY  ?? '';
const CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER  ?? 'eu';
const API_URL = import.meta.env.VITE_API_BASE_URL    ?? 'http://localhost:3001/api';

let _instance: Pusher | null = null;

export function getPusher(): Pusher | null {
  if (!KEY) return null;
  if (!_instance) {
    _instance = new Pusher(KEY, {
      cluster: CLUSTER,
      authEndpoint: `${API_URL}/pusher/auth`,
      auth: {
        // Lit le token depuis la mémoire (apiClient) au moment de la création
        headers: {
          Authorization: `Bearer ${apiClient.getToken() ?? ''}`,
        },
      },
    });
  }
  return _instance;
}

export function destroyPusher() {
  if (_instance) {
    _instance.disconnect();
    _instance = null;
  }
}

// ─── Noms de canaux ───────────────────────────────────────────────────────────

export const CH = {
  notifications:  'notifications',
  dashboard:      'dashboard',
  assures:        'assures',
  chatAdmin:      'chat-admin',
  chatClient:     (uid: string) => `chat-client-${uid}`,
} as const;

// ─── Noms d'événements ────────────────────────────────────────────────────────

export const EV = {
  notification:   'new-notification',
  statsUpdate:    'stats-update',
  activityPush:   'activity-push',
  assureCreated:  'assure-created',
  assureUpdated:  'assure-updated',
  assureDeleted:  'assure-deleted',
  clientMessage:  'client-message',
  adminReply:     'admin-reply',
} as const;

// ─── Payloads typés ───────────────────────────────────────────────────────────

export interface NotifPayload {
  id:            string;
  type:          string;
  priority:      'high' | 'low';
  message:       string;
  detail:        string;
  link:          string;
  time:          string;
  targetRole?:   string;
  targetUserId?: string;
}

export interface StatsPayload {
  totalAssures?: number;
  totalPolices?: number;
  totalSinistres?: number;
  totalPrestataires?: number;
  totalConsultations?: number;
  totalPrescriptions?: number;
  sinistresEnAttente?: number;
  sinistresApprouves?: number;
  sinistresPaies?: number;
  montantRembourse?: number;
}

export interface ActivityPayload {
  id: number;
  action: string;
  detail: string;
  type: string;
  date: string | null;
  time?: string;
}

export interface AssureEventPayload {
  assure?: Record<string, unknown>;
  id?: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}
