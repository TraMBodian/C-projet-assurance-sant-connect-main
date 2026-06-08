package com.assurance.sante.connect.security;

import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Valide le JWT dans le frame STOMP CONNECT.
 * Sans token valide, la connexion WebSocket est rejetée.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository   userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
            MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("WebSocket CONNECT rejeté : Authorization manquant");
            throw new org.springframework.messaging.MessageDeliveryException(
                "Connexion WebSocket refusée : token JWT requis");
        }

        String token = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("WebSocket CONNECT rejeté : token JWT invalide");
            throw new org.springframework.messaging.MessageDeliveryException(
                "Connexion WebSocket refusée : token JWT invalide ou expiré");
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        userRepository.findByEmail(email).ifPresent(user -> {
            List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(email, null, authorities);
            // Identifiant STOMP = userId (utilisé par convertAndSendToUser)
            accessor.setUser(auth);
            log.debug("WebSocket CONNECT autorisé : userId={} role={}", user.getId(), user.getRole());
        });

        return message;
    }
}
