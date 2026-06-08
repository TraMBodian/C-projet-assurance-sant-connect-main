package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.ActiveSession;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.ActiveSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActiveSessionService {

    private final ActiveSessionRepository repo;

    public void login(User user) {
        // Fermer toute session précédente pour cet email
        repo.findByEmailAndActiveTrue(user.getEmail()).ifPresent(s -> {
            s.setActive(false);
            repo.save(s);
        });

        ActiveSession session = ActiveSession.builder()
            .userId(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .loginTime(LocalDateTime.now())
            .lastActivity(LocalDateTime.now())
            .active(true)
            .build();

        repo.save(session);
    }

    public void updateActivity(String email) {
        repo.findByEmailAndActiveTrue(email).ifPresent(session -> {
            session.setLastActivity(LocalDateTime.now());
            repo.save(session);
        });
    }

    public void logout(String email) {
        repo.findByEmailAndActiveTrue(email).ifPresent(session -> {
            session.setActive(false);
            repo.save(session);
        });
    }

    public List<ActiveSession> getActiveSessions() {
        return repo.findByActiveTrue();
    }

    /** Marque inactives les sessions sans activité depuis plus de 15 minutes */
    @Scheduled(fixedRate = 60_000)
    public void cleanupInactiveSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(15);
        repo.findByActiveTrue().forEach(s -> {
            if (s.getLastActivity() != null && s.getLastActivity().isBefore(cutoff)) {
                s.setActive(false);
                repo.save(s);
            }
        });
    }

    /** Supprime définitivement les sessions fantômes inactives depuis plus de 24h */
    @Scheduled(cron = "0 0 2 * * ?")  // Tous les jours à 2h du matin
    public void purgeOldSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        List<ActiveSession> old = repo.findAll().stream()
            .filter(s -> !s.isActive() && s.getLastActivity() != null && s.getLastActivity().isBefore(cutoff))
            .toList();
        if (!old.isEmpty()) {
            repo.deleteAll(old);
        }
    }
}
