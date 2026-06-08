package com.assurance.sante.connect.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Résolution sécurisée de l'adresse IP cliente.
 *
 * L'en-tête {@code X-Forwarded-For} est trivialement falsifiable par le client
 * (usurpation d'IP dans les logs d'audit, contournement du rate-limit). On ne lui
 * accorde donc AUCUNE confiance par défaut.
 *
 * Comportement :
 *  - {@code app.trustProxy=false} (défaut) : on utilise toujours {@code getRemoteAddr()}.
 *  - {@code app.trustProxy=true} (déploiement DERRIÈRE un reverse-proxy de confiance) :
 *    on prend la DERNIÈRE valeur de {@code X-Forwarded-For} — celle ajoutée par le
 *    proxy de confiance le plus proche. Un client ne peut que PRÉ-pendre des valeurs
 *    à gauche : la valeur de droite reste donc fiable. On ne prend jamais la valeur
 *    la plus à gauche (contrôlée par le client).
 *
 * À n'activer ({@code TRUST_PROXY=true}) que lorsque l'application est réellement
 * servie derrière un proxy de confiance unique qui réécrit l'en-tête.
 */
@Component
public class ClientIpResolver {

    @Value("${app.trustProxy:false}")
    private boolean trustProxy;

    public String resolve(HttpServletRequest request) {
        if (request == null) return null;

        if (trustProxy) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                String[] parts = xff.split(",");
                // Dernière entrée = ajoutée par le proxy de confiance le plus proche
                return parts[parts.length - 1].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
