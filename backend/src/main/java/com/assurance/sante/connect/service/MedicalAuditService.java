package com.assurance.sante.connect.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Journalisation des accès aux données médicales sensibles (exigence HIPAA / RGPD :
 * traçabilité « qui a consulté quel dossier »).
 *
 * Chaque lecture d'une ressource sensible (consultation, ordonnance, document,
 * dossier patient, sinistre) doit générer une entrée d'audit contenant :
 * utilisateur, rôle, date (gérée par AuditLog), IP, type de ressource et identifiant.
 *
 * Délègue le stockage à {@link AuditLogService} (asynchrone, non bloquant).
 */
@Service
@RequiredArgsConstructor
public class MedicalAuditService {

    private final AuditLogService auditLogService;

    /** Action enregistrée pour toute lecture de données médicales. */
    public static final String ACTION_ACCESS = "MEDICAL_ACCESS";

    /**
     * Journalise un accès en lecture à une ressource médicale.
     *
     * @param auth         contexte d'authentification de l'appelant
     * @param resourceType type de ressource (CONSULTATION, PRESCRIPTION, DOCUMENT, SINISTRE, PATIENT)
     * @param resourceId   identifiant de la ressource consultée
     * @param ip           adresse IP résolue de l'appelant
     */
    public void logAccess(Authentication auth, String resourceType, Long resourceId, String ip) {
        String email = auth != null ? auth.getName() : "anonymous";
        String role  = auth != null
            ? auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst().orElse("UNKNOWN")
                .replace("ROLE_", "")
            : "UNKNOWN";

        auditLogService.log(
            ACTION_ACCESS,
            resourceType,
            resourceId,
            email,
            role,
            "Accès en lecture à " + resourceType + " #" + resourceId,
            ip);
    }
}
