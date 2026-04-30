package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.LoginRequest;
import com.assurance.sante.connect.dto.RegisterRequest;
import com.assurance.sante.connect.dto.AuthResponse;
import com.assurance.sante.connect.dto.UserDto;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.AuthService;
import com.assurance.sante.connect.service.ActiveSessionService;
import com.assurance.sante.connect.service.OtpService;
import com.assurance.sante.connect.service.UserService;
import com.assurance.sante.connect.security.JwtAuthenticationToken;
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

    @Value("${app.jwtRefreshExpirationMs:604800000}")
    private long refreshExpirationMs;

    @Value("${app.cookieSecure:false}")
    private boolean cookieSecure;

    // ─── Cookie helpers ───────────────────────────────────────────────────────

    private void setRefreshCookie(HttpServletResponse response, String tokenValue) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", tokenValue)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "None" : "Lax")
                .path("/api/auth")
                .maxAge(Duration.ofMillis(refreshExpirationMs))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSecure ? "None" : "Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    // ─── Endpoints ────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthResponse auth = authService.login(request);

        // Refresh token → cookie httpOnly (jamais exposé dans le body)
        setRefreshCookie(response, auth.getRefreshToken());
        auth.setRefreshToken(null);

        return ResponseEntity.ok(ApiResponse.success(auth));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse auth = authService.register(request);
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
            HttpServletResponse response) {

        if (authentication instanceof JwtAuthenticationToken jwt) {
            authService.logout(jwt.getEmail());
        }
        // Révoquer le refresh token et effacer le cookie
        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.revokeRefreshToken(refreshToken);
        }
        clearRefreshCookie(response);
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
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody Map<String, String> body) {
        String email       = body.get("email");
        String code        = body.get("code");
        String newPassword = body.get("newPassword");
        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Données manquantes"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Mot de passe trop court (min 6 caractères)"));
        }
        if (!otpService.verifyOtp(email, code)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Code invalide ou expiré"));
        }
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        userService.changePassword(user.getId(), null, newPassword);
        otpService.invalidate(email);
        return ResponseEntity.ok(ApiResponse.success("Mot de passe réinitialisé avec succès"));
    }
}
