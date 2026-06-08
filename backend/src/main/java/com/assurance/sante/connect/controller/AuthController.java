package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.LoginRequest;
import com.assurance.sante.connect.dto.RegisterRequest;
import com.assurance.sante.connect.dto.AuthResponse;
import com.assurance.sante.connect.dto.UserDto;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.AuditLogService;
import com.assurance.sante.connect.service.AuthService;
import com.assurance.sante.connect.service.ActiveSessionService;
import com.assurance.sante.connect.service.OtpService;
import com.assurance.sante.connect.service.UserService;
import com.assurance.sante.connect.security.JwtAuthenticationToken;
import com.assurance.sante.connect.security.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService          authService;
    private final ActiveSessionService activeSessionService;
    private final OtpService           otpService;
    private final UserRepository       userRepository;
    private final UserService          userService;
    private final AuditLogService      auditLogService;
    private final ClientIpResolver     clientIpResolver;

    @Value("${app.jwtRefreshExpirationMs:604800000}")
    private long refreshExpirationMs;

    @Value("${app.cookieSecure:false}")
    private boolean cookieSecure;

    // ─── Cookie helpers ───────────────────────────────────────────────────────

    private void setRefreshCookie(HttpServletResponse response, String tokenValue) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", tokenValue)
                .httpOnly(true)
                .secure(cookieSecure)
                // Strict en prod (HTTPS), Lax en dev (HTTP) — None causerait des problèmes sans HTTPS
                .sameSite(cookieSecure ? "Strict" : "Lax")
                .path("/api/auth")
                .maxAge(Duration.ofMillis(refreshExpirationMs))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "Strict" : "Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // ─── Endpoints ────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        AuthResponse auth = authService.login(request);

        setRefreshCookie(response, auth.getRefreshToken());
        auth.setRefreshToken(null);

        // Audit : connexion réussie
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);
        auditLogService.log(
            "LOGIN", "USER",
            user != null ? user.getId() : null,
            request.getEmail(),
            user != null ? user.getRole().name() : "UNKNOWN",
            "Connexion réussie",
            resolveIp(httpRequest));

        return ResponseEntity.ok(ApiResponse.success(auth));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        AuthResponse auth = authService.register(request);

        auditLogService.log(
            "REGISTER", "USER", null,
            request.getEmail(), request.getRole(),
            "Nouveau compte créé : " + request.getFullName(),
            resolveIp(httpRequest));

        return ResponseEntity.ok(ApiResponse.success(auth));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken jwt) {
            UserDto userDto = authService.getCurrentUser(jwt.getEmail());
            return ResponseEntity.ok(ApiResponse.success(userDto));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Authentification requise"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            Authentication authentication,
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String email = null;
        String role  = "UNKNOWN";
        if (authentication instanceof JwtAuthenticationToken jwt) {
            email = jwt.getEmail();
            authService.logout(email);
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) role = user.getRole().name();
        }
        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.revokeRefreshToken(refreshToken);
        }
        clearRefreshCookie(response);

        auditLogService.log("LOGOUT", "USER", null, email, role,
            "Déconnexion", resolveIp(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Déconnexion réussie"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Refresh token manquant"));
        }

        // Rotation : ancien token révoqué, nouveau émis
        AuthResponse auth = authService.refreshAccessToken(refreshToken);

        setRefreshCookie(response, auth.getRefreshToken());
        auth.setRefreshToken(null);

        return ResponseEntity.ok(ApiResponse.success(auth));
    }

    /** Étape 1 : envoyer l'OTP par email */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email requis"));
        }
        if (userRepository.findByEmail(email.toLowerCase()).isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success("Si cet email existe, un code a été envoyé"));
        }
        otpService.sendOtp(email);
        return ResponseEntity.ok(ApiResponse.success("Code envoyé à " + email));
    }

    /** Étape 2 : vérifier l'OTP */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code  = body.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email et code requis"));
        }
        if (!otpService.verifyOtp(email, code)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Code invalide ou expiré"));
        }
        return ResponseEntity.ok(ApiResponse.success("Code valide"));
    }

    /** Étape 3 : réinitialiser le mot de passe avec l'OTP */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {
        String email       = body.get("email");
        String code        = body.get("code");
        String newPassword = body.get("newPassword");
        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Données manquantes"));
        }
        if (!com.assurance.sante.connect.security.PasswordPolicy.isValid(newPassword)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                com.assurance.sante.connect.security.PasswordPolicy.REQUIREMENTS_MESSAGE));
        }
        if (!otpService.verifyOtp(email, code)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Code invalide ou expiré"));
        }
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        userService.changePassword(user.getId(), null, newPassword);
        otpService.invalidate(email);

        auditLogService.log("PASSWORD_RESET", "USER", user.getId(),
            email, user.getRole().name(),
            "Mot de passe réinitialisé via OTP",
            resolveIp(httpRequest));

        return ResponseEntity.ok(ApiResponse.success("Mot de passe réinitialisé avec succès"));
    }

    // ── Helper IP ─────────────────────────────────────────────────────────────

    private String resolveIp(HttpServletRequest req) {
        return clientIpResolver.resolve(req);
    }
}
