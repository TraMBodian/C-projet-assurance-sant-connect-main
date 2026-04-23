package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.LoginRequest;
import com.assurance.sante.connect.dto.RegisterRequest;
import com.assurance.sante.connect.dto.AuthResponse;
import com.assurance.sante.connect.dto.UserDto;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.AuthService;
import com.assurance.sante.connect.security.JwtAuthenticationToken;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
}
