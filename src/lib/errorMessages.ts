/**
 * Mappe les messages d'erreur techniques vers des messages lisibles pour l'utilisateur.
 * Les messages techniques (chemins, stack traces, IDs internes) ne doivent jamais
 * être affichés directement dans l'interface.
 */

const TECHNICAL_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /session expir/i,              message: "Votre session a expiré. Veuillez vous reconnecter." },
  { pattern: /accès refusé|access denied/i, message: "Vous n'avez pas les droits pour effectuer cette action." },
  { pattern: /introuvable|not found/i,      message: "Élément introuvable. Il a peut-être été supprimé." },
  { pattern: /connexion|network|fetch/i,    message: "Problème de connexion. Vérifiez votre accès internet." },
  { pattern: /délai|timeout|abort/i,        message: "La requête a pris trop de temps. Réessayez dans un moment." },
  { pattern: /trop de requêtes|too many/i,  message: "Trop de tentatives. Veuillez patienter avant de réessayer." },
  { pattern: /erreur serveur|server error|500/i, message: "Une erreur inattendue s'est produite. Notre équipe a été notifiée." },
  { pattern: /données liées|données exist/i, message: "Impossible de supprimer : des données associées existent." },
  { pattern: /email.*exist|already.*exist/i, message: "Cette adresse email est déjà utilisée." },
  { pattern: /mot de passe|password/i,      message: "Mot de passe incorrect. Vérifiez votre saisie." },
];

/**
 * Retourne un message d'erreur adapté à l'utilisateur.
 * Si aucun pattern ne correspond, retourne le message original (déjà lisible)
 * ou un message générique en cas de message vide/technique.
 */
export function toUserMessage(error: unknown, fallback = "Une erreur s'est produite. Veuillez réessayer."): string {
  let raw = "";

  if (error instanceof Error) {
    raw = error.message;
  } else if (typeof error === "string") {
    raw = error;
  }

  if (!raw) return fallback;

  // Si le message contient un chemin d'API ou une stack trace, remplacer
  if (/\/api\/|at [A-Z]|\.java|\.ts:\d|null pointer|NullPointer/i.test(raw)) {
    return fallback;
  }

  for (const { pattern, message } of TECHNICAL_PATTERNS) {
    if (pattern.test(raw)) return message;
  }

  // Le message semble déjà lisible (moins de 200 chars, pas technique)
  if (raw.length < 200 && !/[{}[\]()]/.test(raw)) return raw;

  return fallback;
}
