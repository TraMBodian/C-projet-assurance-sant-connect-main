// Local notification store — persists cross-provider/client events in localStorage

export interface LocalNotification {
  id:            string;
  type:          "consultation" | "prescription" | "paiement" | "info" | "famille" | "message" | "sinistre" | "patient" | "prestataire" | "acceptation";
  priority:      "high" | "low";
  message:       string;
  detail:        string;
  link:          string;
  time:          string;
  targetRole?:   string;
  targetUserId?: string;
}

const STORE_KEY = "cnart_local_notifications";
const MAX_ITEMS = 50;

function load(): LocalNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]");
  } catch { return []; }
}

function save(items: LocalNotification[]): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export const notificationStore = {
  getAll(): LocalNotification[] {
    return load();
  },

  push(notif: Omit<LocalNotification, "id" | "time">): LocalNotification {
    const item: LocalNotification = {
      ...notif,
      id:   `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      time: new Date().toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }),
    };
    save([item, ...load()]);
    window.dispatchEvent(new CustomEvent("cnart_notif_update"));
    return item;
  },

  remove(id: string): void {
    save(load().filter((n) => n.id !== id));
    window.dispatchEvent(new CustomEvent("cnart_notif_update"));
  },

  clear(): void {
    localStorage.removeItem(STORE_KEY);
    window.dispatchEvent(new CustomEvent("cnart_notif_update"));
  },

  /** Push a consultation-completed notification (visible aux prestataires et admins) */
  notifyConsultationCompleted(params: { assureNom: string; medecinNom: string; specialite: string; date: string }): void {
    notificationStore.push({
      type:       "consultation",
      priority:   "low",
      message:    `Consultation terminée — ${params.assureNom}`,
      detail:     `${params.medecinNom} · ${params.specialite} · ${params.date}`,
      link:       "/consultations",
      targetRole: "prestataire",
    });
  },

  /** Push a prescription-issued notification (visible aux prestataires et admins) */
  notifyPrescriptionIssued(params: { assureNom: string; medecinNom: string; nbMeds: number; date: string }): void {
    notificationStore.push({
      type:       "prescription",
      priority:   "low",
      message:    `Nouvelle ordonnance — ${params.assureNom}`,
      detail:     `${params.medecinNom} · ${params.nbMeds} médicament${params.nbMeds !== 1 ? "s" : ""} · ${params.date}`,
      link:       "/prescriptions",
      targetRole: "prestataire",
    });
  },

  /** Push a famille-en-attente notification (notifies admin) */
  notifyFamilleEnAttente(params: { nom: string }): void {
    notificationStore.push({
      type:       "famille",
      priority:   "high",
      message:    `Nouvelle demande famille — ${params.nom}`,
      detail:     "Questionnaire médical soumis · En attente de validation",
      link:       "/admin/maladie-famille?focus=pending",
      targetRole: "admin",
    });
  },

  /** Push a payment-reminder notification for a specific client */
  notifyPaymentReminder(params: { assureNom: string; montant: string; echeance: string; userId?: string }): void {
    notificationStore.push({
      type:          "paiement",
      priority:      "high",
      message:       `Rappel de paiement — ${params.assureNom}`,
      detail:        `Montant dû : ${params.montant} · Échéance : ${params.echeance}`,
      link:          "/polices",
      targetRole:    "client",
      targetUserId:  params.userId,
    });
  },

  /** Nouveau message reçu */
  notifyMessage(params: { senderName: string; preview: string }): void {
    notificationStore.push({
      type:     "message",
      priority: "high",
      message:  `Nouveau message — ${params.senderName}`,
      detail:   params.preview,
      link:     "/chat",
    });
  },

  /** Nouveau sinistre déclaré */
  notifySinistre(params: { assureNom: string; reference: string }): void {
    notificationStore.push({
      type:       "sinistre",
      priority:   "high",
      message:    `Nouveau sinistre — ${params.assureNom}`,
      detail:     `Référence : ${params.reference}`,
      link:       "/sinistres",
      targetRole: "admin",
    });
  },

  /** Nouveau patient (assuré) enregistré */
  notifyPatient(params: { nom: string }): void {
    notificationStore.push({
      type:       "patient",
      priority:   "low",
      message:    `Nouveau patient — ${params.nom}`,
      detail:     "Dossier créé · En attente de validation",
      link:       "/assures",
      targetRole: "admin",
    });
  },

  /** Nouveau prestataire enregistré */
  notifyPrestataire(params: { nom: string }): void {
    notificationStore.push({
      type:       "prestataire",
      priority:   "low",
      message:    `Nouveau prestataire — ${params.nom}`,
      detail:     "En attente de validation",
      link:       "/admin/prestataires",
      targetRole: "admin",
    });
  },

  /** Proposition acceptée (visible aux admins uniquement) */
  notifyAcceptation(params: { reference: string; nom: string }): void {
    notificationStore.push({
      type:       "acceptation",
      priority:   "high",
      message:    `Proposition acceptée — ${params.nom}`,
      detail:     `Référence : ${params.reference} · Prête à convertir en police`,
      link:       "/admin/propositions",
      targetRole: "admin",
    });
  },
};
