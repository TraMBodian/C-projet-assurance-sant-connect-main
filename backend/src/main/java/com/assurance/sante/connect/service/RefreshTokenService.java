package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.RefreshToken;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.exception.UnauthorizedException;
import com.assurance.sante.connect.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${app.jwtRefreshExpirationMs:604800000}")
    private long refreshExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);

        RefreshToken token = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .build();

        return refreshTokenRepository.save(token);
    }

    @Transactional
    public RefreshToken validateAndRotate(String tokenValue) {
        RefreshToken old = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new UnauthorizedException("Refresh token invalide ou inexistant"));

        if (old.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(old);
            throw new UnauthorizedException("Refresh token expiré, veuillez vous reconnecter");
        }

        // Rotation : l'ancien token est supprimé, un nouveau est émis
        return createRefreshToken(old.getUser());
    }

    @Transactional
    public void revokeToken(String tokenValue) {
        refreshTokenRepository.deleteByToken(tokenValue);
    }

    @Transactional
    public void revokeAllUserTokens(User user) {
        refreshTokenRepository.deleteByUser(user);
    }

    // Purge quotidienne à 3h du matin
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void purgeExpiredTokens() {
        int deleted = refreshTokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        log.info("Purge refresh tokens expirés : {} supprimé(s)", deleted);
    }
}
