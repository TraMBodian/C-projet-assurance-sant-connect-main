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
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response));
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
    public ResponseEntity<ApiResponse<String>> logout(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken jwt) {
            authService.logout(jwt.getEmail());
        }
        return ResponseEntity.ok(ApiResponse.success("Déconnexion réussie"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Refresh token requis"));
        }
        AuthResponse response = authService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /** Étape 1 : envoyer l'OTP par email */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email requis"));
        }
        if (userRepository.findByEmail(email.toLowerCase()).isEmpty()) {
            // Ne pas révéler si l'email existe ou non (sécurité)
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
