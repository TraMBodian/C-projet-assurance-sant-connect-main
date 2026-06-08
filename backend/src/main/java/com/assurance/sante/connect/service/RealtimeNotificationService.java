package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Notification;
import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.NotificationRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Pousse des notifications temps-réel via STOMP WebSocket aux utilisateurs concernés.
 * Les prestataires reçoivent les events sur /user/{userId}/queue/notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RealtimeNotificationService {

    private final SimpMessagingTemplate  messagingTemplate;
    private final PrestataireRepository  prestataireRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Notifie un prestataire identifié par son ID.
     * Si le prestataire est lié à un compte User (user_id FK), la notification est envoyée à ce compte.
     */
    public void notifyPrestataire(Long prestataireId, String type, String message, String link) {
        prestataireRepository.findById(prestataireId).ifPresent(p -> {
            if (p.getUser() != null) {
                push(p.getUser().getId().toString(), type, message, link, "medium");
            }
        });
    }

    /**
     * Notifie tous les prestataires ACTIFS d'un type donné (ex: nouvelle ligne MEDICAMENT → toutes les PHARMACIE).
     */
    public void notifyPrestatairesOfType(Prestataire.TypePrestataire type, String notifType, String message, String link) {
        List<Prestataire> actifs = prestataireRepository.findAll().stream()
            .filter(p -> p.getType() == type
                && p.getStatut() == Prestataire.StatutPrestataire.ACTIF
                && p.getUser() != null)
            .toList();

        for (Prestataire p : actifs) {
            push(p.getUser().getId().toString(), notifType, message, link, "low");
        }
    }

    /**
     * Notifie un utilisateur identifié par son userId.
     */
    public void notifyUser(Long userId, String type, String message, String link, String priority) {
        push(userId.toString(), type, message, link, priority);
    }

    /**
     * Notifie tous les administrateurs ACTIVE du système.
     */
    public void notifyAdmins(String type, String message, String link) {
        userRepository.findByRole(User.UserRole.ADMIN).stream()
            .filter(u -> u.getStatus() == User.UserStatus.ACTIVE)
            .forEach(u -> push(u.getId().toString(), type, message, link, "high"));
    }

    private void push(String userId, String type, String message, String link, String priority) {
        // Persister en base pour l'historique et le multi-device
        try {
            Notification saved = notificationRepository.save(Notification.builder()
                .userId(Long.parseLong(userId))
                .type(type)
                .message(message)
                .detail("")
                .link(link)
                .priority(priority)
                .build());

            Map<String, Object> payload = new HashMap<>();
            payload.put("id",       "db-" + saved.getId());
            payload.put("dbId",     saved.getId());
            payload.put("type",     type);
            payload.put("message",  message);
            payload.put("link",     link);
            payload.put("priority", priority);
            payload.put("time",     saved.getCreatedAt().format(FMT));
            payload.put("read",     false);
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", payload);
        } catch (Exception e) {
            log.warn("Impossible d'envoyer la notification STOMP à userId={}: {}", userId, e.getMessage());
        }
    }
}
