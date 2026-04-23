package com.assurance.sante.connect.security;

import com.assurance.sante.connect.exception.UnauthorizedException;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_MS = 15 * 60 * 1000L;

    private record AttemptInfo(int count, Instant blockedUntil) {}

    private final ConcurrentHashMap<String, AttemptInfo> attempts = new ConcurrentHashMap<>();

    public void checkAndRegisterFailure(String email) {
        Instant now = Instant.now();
        AttemptInfo info = attempts.getOrDefault(email, new AttemptInfo(0, now));

        if (info.blockedUntil().isAfter(now) && info.count() >= MAX_ATTEMPTS) {
            long secondsLeft = info.blockedUntil().getEpochSecond() - now.getEpochSecond();
            throw new UnauthorizedException(
                "Trop de tentatives échouées. Réessayez dans " + secondsLeft + " secondes."
            );
        }

        int newCount = info.count() + 1;
        Instant newBlockedUntil = newCount >= MAX_ATTEMPTS
                ? now.plusMillis(BLOCK_DURATION_MS)
                : now;
        attempts.put(email, new AttemptInfo(newCount, newBlockedUntil));
    }

    public void checkBlocked(String email) {
        AttemptInfo info = attempts.get(email);
        if (info == null) return;
        if (info.count() >= MAX_ATTEMPTS && info.blockedUntil().isAfter(Instant.now())) {
            long secondsLeft = info.blockedUntil().getEpochSecond() - Instant.now().getEpochSecond();
            throw new UnauthorizedException(
                "Trop de tentatives échouées. Réessayez dans " + secondsLeft + " secondes."
            );
        }
    }

    public void resetAttempts(String email) {
        attempts.remove(email);
    }
}
