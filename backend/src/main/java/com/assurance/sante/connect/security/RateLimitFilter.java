package com.assurance.sante.connect.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting via Bucket4j — par IP, par endpoint.
 *
 * Limites :
 *  /api/auth/login          → 10 req / minute  (anti brute-force)
 *  /api/auth/register       → 5  req / minute  (anti spam)
 *  /api/auth/forgot-password→ 3  req / minute  (anti OTP abuse)
 *  autres POST/PUT sensibles→ 30 req / minute  (protection générale)
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final ClientIpResolver clientIpResolver;

    // Buckets distincts par endpoint et par IP
    private final Map<String, Bucket> loginBuckets    = new ConcurrentHashMap<>();
    private final Map<String, Bucket> registerBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> otpBuckets      = new ConcurrentHashMap<>();
    private final Map<String, Bucket> generalBuckets  = new ConcurrentHashMap<>();

    private static final java.util.List<String> GENERAL_PATHS = java.util.List.of(
        "/api/consultations",
        "/api/prescriptions",
        "/api/prestations",
        "/api/sinistres",
        "/api/documents"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        if (!"POST".equalsIgnoreCase(method) && !"PUT".equalsIgnoreCase(method)) return true;
        String uri = request.getRequestURI();
        boolean isSensitive = uri.startsWith("/api/auth/login")
            || uri.startsWith("/api/auth/register")
            || uri.startsWith("/api/auth/forgot-password")
            || GENERAL_PATHS.stream().anyMatch(uri::startsWith);
        return !isSensitive;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String ip  = resolveClientIp(request);
        String uri = request.getRequestURI();

        Bucket bucket;
        if (uri.startsWith("/api/auth/login")) {
            bucket = loginBuckets.computeIfAbsent(ip, k -> buildBucket(10, Duration.ofMinutes(1)));
        } else if (uri.startsWith("/api/auth/register")) {
            bucket = registerBuckets.computeIfAbsent(ip, k -> buildBucket(5, Duration.ofMinutes(1)));
        } else if (uri.startsWith("/api/auth/forgot-password")) {
            bucket = otpBuckets.computeIfAbsent(ip, k -> buildBucket(3, Duration.ofMinutes(1)));
        } else {
            bucket = generalBuckets.computeIfAbsent(ip, k -> buildBucket(30, Duration.ofMinutes(1)));
        }

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"success\":false,\"message\":\"Trop de tentatives. Veuillez patienter avant de réessayer.\"}"
            );
        }
    }

    private static Bucket buildBucket(int capacity, Duration period) {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, period)
                .build())
            .build();
    }

    private String resolveClientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }
}
