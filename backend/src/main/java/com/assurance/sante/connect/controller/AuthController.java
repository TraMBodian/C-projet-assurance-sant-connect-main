package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.LoginRequest;
import com.assurance.sante.connect.dto.RegisterRequest;
import com.assurance.sante.connect.dto.AuthResponse;
import com.assurance.sante.connect.dto.UserDto;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.AuthService;
import com.assurance.sante.connect.security.JwtAuthenticationToken;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8084"})
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken) {
            String email = ((JwtAuthenticationToken) authentication).getEmail();
            UserDto userDto = authService.getCurrentUser(email);
            return ResponseEntity.ok(ApiResponse.success(userDto));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Authentication failed"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logout successful"));
    }

    // Endpoint de test pour vérifier les comptes admin
    @GetMapping("/test-admin-accounts")
    public ResponseEntity<ApiResponse<String>> testAdminAccounts() {
        return ResponseEntity.ok(ApiResponse.success("Admin accounts should be created. Try login with: bassniang7@yahoo.fr / admin1 or bodianm372@gmail.com / admin1"));
    }
}
