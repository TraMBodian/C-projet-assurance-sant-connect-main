package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.ChatContactDto;
import com.assurance.sante.connect.dto.ChatUserDto;
import com.assurance.sante.connect.dto.SendMessageRequest;
import com.assurance.sante.connect.entity.Message;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.MessageRepository;
import com.assurance.sante.connect.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageRepository messageRepository;
    private final UserRepository    userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ── Helpers ─────────────────────────────────────────────────────────────────

    /** Résout l'utilisateur authentifié (par email) ; null si introuvable. */
    private User resolveSender(String email) {
        if (email == null) return null;
        return userRepository.findByEmail(email).orElse(null);
    }

    /** Persiste et notifie un message dont l'expéditeur est DÉJÀ authentifié côté serveur. */
    private Message persistAndNotify(User sender, Long receiverId, String content) {
        Message message = Message.builder()
                .senderId(sender.getId())
                .receiverId(receiverId)
                .content(content)
                .senderName(sender.getFullName())
                .createdAt(LocalDateTime.now())
                .build();
        message = messageRepository.save(message);

        // Notifier le destinataire en temps réel
        messagingTemplate.convertAndSendToUser(
                receiverId.toString(), "/queue/messages", message);
        return message;
    }

    // ── Envoi WebSocket ───────────────────────────────────────────────────────────

    /**
     * Envoi via WebSocket. L'expéditeur est dérivé du {@link Principal} STOMP
     * (injecté par StompAuthChannelInterceptor après validation du JWT) — JAMAIS
     * d'un senderId fourni dans le payload.
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload Map<String, Object> payload, Principal principal) {
        if (principal == null || payload.get("receiverId") == null || payload.get("content") == null) {
            return; // pas d'expéditeur authentifié ou payload incomplet → on ignore
        }
        User sender = resolveSender(principal.getName());
        if (sender == null) return;

        Long receiverId = Long.valueOf(payload.get("receiverId").toString());
        String content  = payload.get("content").toString();
        if (content.isBlank() || content.length() > 2000) return;

        persistAndNotify(sender, receiverId, content);
    }

    // ── Envoi REST (fallback) ──────────────────────────────────────────────────────

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Message>> sendRest(
            @Valid @RequestBody SendMessageRequest request, Authentication auth) {
        User sender = resolveSender(auth != null ? auth.getName() : null);
        if (sender == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));
        }
        Message message = persistAndNotify(sender, request.getReceiverId(), request.getContent());
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    // ── Historique de conversation ──────────────────────────────────────────────────

    /** L'utilisateur connecté doit être l'un des deux participants (ou ADMIN). */
    @GetMapping("/conversation/{userId1}/{userId2}")
    public ResponseEntity<ApiResponse<List<Message>>> getConversation(
            @PathVariable Long userId1,
            @PathVariable Long userId2,
            Authentication auth) {

        User caller = resolveSender(auth != null ? auth.getName() : null);
        if (caller == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));
        }
        boolean isAdmin = caller.getRole() == User.UserRole.ADMIN;
        boolean isParticipant = caller.getId().equals(userId1) || caller.getId().equals(userId2);
        if (!isAdmin && !isParticipant) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : vous ne pouvez consulter que vos propres conversations"));
        }

        List<Message> messages = messageRepository.findConversation(userId1, userId2);
        messages.stream()
                .filter(m -> m.getReceiverId().equals(caller.getId()) && !m.isRead())
                .forEach(m -> { m.setRead(true); messageRepository.save(m); });
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    // ── Contacts de l'utilisateur connecté ────────────────────────────────────────

    /**
     * Liste des contacts de l'appelant. Le {@code userId} du chemin doit
     * correspondre à l'utilisateur connecté (ou être appelé par un ADMIN).
     * Aucune donnée d'un autre utilisateur n'est accessible.
     */
    @GetMapping("/contacts/{userId}")
    public ResponseEntity<ApiResponse<List<ChatContactDto>>> getContacts(
            @PathVariable Long userId, Authentication auth) {

        User caller = resolveSender(auth != null ? auth.getName() : null);
        if (caller == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));
        }
        boolean isAdmin = caller.getRole() == User.UserRole.ADMIN;
        if (!isAdmin && !caller.getId().equals(userId)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : vous ne pouvez consulter que vos propres contacts"));
        }

        List<Long> contactIds = messageRepository.findContactIds(userId);
        List<ChatContactDto> contacts = userRepository.findAllById(contactIds).stream()
                .map(u -> {
                    List<Message> conv = messageRepository.findConversation(userId, u.getId());
                    String lastMessage = null;
                    String lastTime    = null;
                    if (!conv.isEmpty()) {
                        Message last = conv.get(conv.size() - 1);
                        lastMessage = last.getContent();
                        lastTime    = last.getCreatedAt().toString();
                    }
                    long unread = messageRepository.findUnreadByReceiver(userId).stream()
                            .filter(m -> m.getSenderId().equals(u.getId())).count();
                    return ChatContactDto.builder()
                            .id(u.getId())
                            .fullName(u.getFullName())
                            .role(u.getRole().name())
                            .lastMessage(lastMessage)
                            .lastTime(lastTime)
                            .unread(unread)
                            .build();
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(contacts));
    }

    // ── Annuaire des utilisateurs (pour démarrer une conversation) ──────────────────

    /**
     * Liste minimale des utilisateurs actifs (id, nom, rôle — pas d'email).
     * {@code excludeId} doit correspondre à l'appelant (ou ADMIN).
     */
    @GetMapping("/users/{excludeId}")
    public ResponseEntity<ApiResponse<List<ChatUserDto>>> getAllUsers(
            @PathVariable Long excludeId, Authentication auth) {

        User caller = resolveSender(auth != null ? auth.getName() : null);
        if (caller == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Non authentifié"));
        }
        boolean isAdmin = caller.getRole() == User.UserRole.ADMIN;
        if (!isAdmin && !caller.getId().equals(excludeId)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé"));
        }

        List<ChatUserDto> users = userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(excludeId) && u.getStatus() == User.UserStatus.ACTIVE)
                .map(ChatUserDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
