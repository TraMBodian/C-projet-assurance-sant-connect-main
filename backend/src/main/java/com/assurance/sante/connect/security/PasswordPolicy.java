package com.assurance.sante.connect.security;

/**
 * Politique de mot de passe centralisée (OWASP ASVS / plateforme de santé).
 *
 * Exigences : 12 caractères minimum, au moins une majuscule, une minuscule,
 * un chiffre et un caractère spécial. Appliquée à l'inscription, au changement
 * et à la réinitialisation de mot de passe.
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 12;

    public static final String REQUIREMENTS_MESSAGE =
        "Le mot de passe doit contenir au moins 12 caractères, dont une majuscule, "
        + "une minuscule, un chiffre et un caractère spécial.";

    private PasswordPolicy() {}

    public static boolean isValid(String password) {
        if (password == null || password.length() < MIN_LENGTH) return false;
        boolean upper   = password.chars().anyMatch(Character::isUpperCase);
        boolean lower   = password.chars().anyMatch(Character::isLowerCase);
        boolean digit   = password.chars().anyMatch(Character::isDigit);
        boolean special = password.chars().anyMatch(c -> !Character.isLetterOrDigit(c));
        return upper && lower && digit && special;
    }

    /**
     * Valide le mot de passe ou lève {@link IllegalArgumentException} avec un message explicite.
     */
    public static void validate(String password) {
        if (!isValid(password)) {
            throw new IllegalArgumentException(REQUIREMENTS_MESSAGE);
        }
    }
}
