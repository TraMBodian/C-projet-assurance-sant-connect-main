package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.*;
import com.assurance.sante.connect.repository.*;
import com.assurance.sante.connect.security.JwtAuthenticationToken;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SinistreRepository      sinistreRepository;
    private final UserRepository          userRepository;
    private final ConsultationRepository  consultationRepository;
    private final PrestataireRepository   prestataireRepository;
    private final NotificationRepository  notificationRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    // ─── GET /api/notifications ───────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNotifications(Authentication authentication) {
        User currentUser = resolveUser(authentication);
        if (currentUser == null) return ResponseEntity.ok(ApiResponse.success(List.of()));

        String userRole = currentUser.getRole().name();
        Long   userId   = currentUser.getId();
        boolean isAdmin       = "ADMIN".equals(userRole);
        boolean isPrestataire = "PRESTATAIRE".equals(userRole);
        boolean isClient      = "CLIENT".equals(userRole);

        // ── 1. Notifications persistées (temps-réel reçues via STOMP, stockées) ──
        List<Map<String, Object>> persisted = notificationRepository
            .findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(n -> toMap(n, currentUser))
            .collect(Collectors.toList());

        // ── 2. Notifications dynamiques (calculées à la volée) ────────────────
        List<Map<String, Object>> dynamic = new ArrayList<>();
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        if (isAdmin) {
            dynamic.addAll(buildAdminNotifications(sevenDaysAgo));
        }
        if (isPrestataire) {
            String email = authentication instanceof JwtAuthenticationToken jwt ? jwt.getEmail() : "";
            dynamic.addAll(buildPrestataireNotifications(email, sevenDaysAgo));
        }
        if (isClient) {
            dynamic.addAll(buildClientNotifications(userId, sevenDaysAgo));
        }

        // ── Fusion : persistées d'abord, dynamiques ensuite ──────────────────
        List<Map<String, Object>> all = new ArrayList<>(persisted);
        Set<String> persistedIds = persisted.stream()
            .map(m -> String.valueOf(m.get("id"))).collect(Collectors.toSet());
        dynamic.stream()
            .filter(m -> !persistedIds.contains(String.valueOf(m.get("id"))))
            .forEach(all::add);

        return ResponseEntity.ok(ApiResponse.success(all));
    }

    // ─── PATCH /api/notifications/{id}/read ──────────────────────────────────
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id, Authentication authentication) {
        User currentUser = resolveUser(authentication);
        if (currentUser == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(currentUser.getId()) && n.getReadAt() == null) {
                n.setReadAt(LocalDateTime.now());
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── PATCH /api/notifications/read-all ───────────────────────────────────
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Integer>> markAllAsRead(Authentication authentication) {
        User currentUser = resolveUser(authentication);
        if (currentUser == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

        int updated = notificationRepository.markAllReadByUserId(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    // ─── DELETE /api/notifications/{id} ──────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id, Authentication authentication) {
        User currentUser = resolveUser(authentication);
        if (currentUser == null) return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));

        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(currentUser.getId())) {
                notificationRepository.delete(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─── GET /api/notifications/unread-count ─────────────────────────────────
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount(Authentication authentication) {
        User currentUser = resolveUser(authentication);
        if (currentUser == null) return ResponseEntity.ok(ApiResponse.success(0L));
        long count = notificationRepository.countUnreadByUserId(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private User resolveUser(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken jwt)) return null;
        return userRepository.findByEmail(jwt.getEmail()).orElse(null);
    }

    private Map<String, Object> toMap(Notification n, User user) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",       "db-" + n.getId());
        m.put("dbId",     n.getId());
        m.put("type",     n.getType());
        m.put("message",  n.getMessage());
        m.put("detail",   n.getDetail() != null ? n.getDetail() : "");
        m.put("link",     n.getLink() != null ? n.getLink() : "");
        m.put("priority", n.getPriority());
        m.put("read",     n.isRead());
        m.put("time",     n.getCreatedAt() != null ? n.getCreatedAt().format(FMT) : "");
        m.put("targetRole",   user.getRole().name().toLowerCase());
        m.put("targetUserId", String.valueOf(user.getId()));
        return m;
    }

    private List<Map<String, Object>> buildAdminNotifications(LocalDateTime since) {
        List<Map<String, Object>> list = new ArrayList<>();

        // Sinistres EN_ATTENTE
        List<Sinistre> enAttente = sinistreRepository.findAll().stream()
            .filter(s -> s.getStatut() == Sinistre.SinistreStatut.EN_ATTENTE)
            .sorted(Comparator.comparing(Sinistre::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .collect(Collectors.toList());

        if (!enAttente.isEmpty()) {
            if (enAttente.size() > 3) {
                list.add(notif("sinistres-batch", "sinistre", "high",
                    enAttente.size() + " sinistre(s) en attente d'approbation",
                    "Action requise", "/sinistres", "admin", null));
            } else {
                for (Sinistre s : enAttente) {
                    String who = s.getAssure() != null ? s.getAssure().getNom() + " " + s.getAssure().getPrenom() : "Inconnu";
                    list.add(notif("sin-" + s.getId(), "sinistre", "high",
                        "Sinistre " + s.getNumero() + " en attente", who, "/sinistres", "admin",
                        s.getCreatedAt() != null ? s.getCreatedAt().format(FMT) : null));
                }
            }
        }

        // Comptes PENDING
        long pending = userRepository.findAll().stream()
            .filter(u -> u.getStatus() == User.UserStatus.PENDING).count();
        if (pending > 0) {
            list.add(notif("users-pending", "user", "high",
                pending + " compte(s) en attente d'activation",
                "Cliquez pour gérer", "/users", "admin", null));
        }

        // Sinistres récents (hors EN_ATTENTE)
        sinistreRepository.findAll().stream()
            .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().isAfter(since)
                && s.getStatut() != Sinistre.SinistreStatut.EN_ATTENTE)
            .sorted(Comparator.comparing(Sinistre::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(5)
            .forEach(s -> {
                String status = switch (s.getStatut()) {
                    case APPROUVE -> "approuvé"; case PAYE -> "payé";
                    case REJETE   -> "rejeté";   case EN_COURS -> "en cours";
                    default -> s.getStatut().name().toLowerCase();
                };
                String who = s.getAssure() != null ? s.getAssure().getNom() + " " + s.getAssure().getPrenom() : "Inconnu";
                list.add(notif("recent-sin-" + s.getId(), "sinistre_recent", "low",
                    "Sinistre " + s.getNumero() + " " + status, who, "/sinistres", "admin",
                    s.getCreatedAt().format(FMT)));
            });

        // Consultations récentes
        long recentConsult = consultationRepository.findAll().stream()
            .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(since)).count();
        if (recentConsult > 0) {
            list.add(notif("consult-recent", "consultation", "low",
                recentConsult + " consultation(s) cette semaine", "", "/consultations", "admin", null));
        }
        return list;
    }

    private List<Map<String, Object>> buildPrestataireNotifications(String email, LocalDateTime since) {
        List<Map<String, Object>> list = new ArrayList<>();
        Optional<Prestataire> prestOpt = prestataireRepository.findFirstByEmail(email);
        if (prestOpt.isEmpty()) return list;

        Long prestId = prestOpt.get().getId();
        LocalDateTime now = LocalDateTime.now();

        long recentConsult = consultationRepository.findByPrestataireId(prestId).stream()
            .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(since)).count();
        if (recentConsult > 0) {
            list.add(notif("consult-recent-prest", "consultation", "low",
                recentConsult + " consultation(s) cette semaine", "", "/consultations", "prestataire", null));
        }

        long upcoming = consultationRepository.findByPrestataireId(prestId).stream()
            .filter(c -> c.getStatut() != null && c.getStatut().name().equals("PROGRAMMEE")
                && c.getDateConsultation() != null
                && c.getDateConsultation().isAfter(now)
                && c.getDateConsultation().isBefore(now.plusDays(7)))
            .count();
        if (upcoming > 0) {
            list.add(notif("upcoming-consult-prest", "consultation_upcoming", "medium",
                upcoming + " consultation(s) programmée(s) dans 7 jours", "", "/consultations", "prestataire", null));
        }
        return list;
    }

    private List<Map<String, Object>> buildClientNotifications(Long userId, LocalDateTime since) {
        List<Map<String, Object>> list = new ArrayList<>();
        sinistreRepository.findAll().stream()
            .filter(s -> s.getAssure() != null && s.getAssure().getId() != null
                && s.getAssure().getId().equals(userId)
                && s.getCreatedAt() != null && s.getCreatedAt().isAfter(since))
            .sorted(Comparator.comparing(Sinistre::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(5)
            .forEach(s -> {
                String status = switch (s.getStatut()) {
                    case EN_ATTENTE -> "en attente"; case APPROUVE -> "approuvé";
                    case PAYE -> "payé"; case REJETE -> "rejeté"; case EN_COURS -> "en cours";
                    default -> s.getStatut().name().toLowerCase();
                };
                Map<String, Object> m = notif("client-sin-" + s.getId(), "sinistre_recent",
                    s.getStatut() == Sinistre.SinistreStatut.REJETE ? "high" : "low",
                    "Sinistre " + s.getNumero() + " " + status, "",
                    "/sinistres", "client", s.getCreatedAt().format(FMT));
                m.put("targetUserId", String.valueOf(userId));
                list.add(m);
            });
        return list;
    }

    private Map<String, Object> notif(String id, String type, String priority,
                                       String message, String detail,
                                       String link, String role, String time) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",         id);
        m.put("type",       type);
        m.put("priority",   priority);
        m.put("message",    message);
        m.put("detail",     detail != null ? detail : "");
        m.put("link",       link);
        m.put("time",       time != null ? time : LocalDateTime.now().format(FMT));
        m.put("targetRole", role);
        m.put("read",       false);
        return m;
    }
}
