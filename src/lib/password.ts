// Politique de mot de passe — DOIT rester alignée avec le backend (PasswordPolicy.java).
// Le backend reste la source de vérité : cette validation n'est qu'une aide UX.

export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Le mot de passe doit contenir au moins 12 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.";

export function isStrongPassword(password: string): boolean {
  if (!password || password.length < PASSWORD_MIN_LENGTH) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasDigit && hasSpecial;
}
