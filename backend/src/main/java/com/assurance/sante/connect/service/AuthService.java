package com.assurance.sante.connect.service;

import com.assurance.sante.connect.dto.LoginRequest;
import com.assurance.sante.connect.dto.RegisterRequest;
import com.assurance.sante.connect.dto.AuthResponse;
import com.assurance.sante.connect.dto.UserDto;
import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.security.JwtTokenProvider;
import com.assurance.sante.connect.security.LoginRateLimiter;
import com.assurance.sante.connect.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PrestataireRepository prestataireRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginRateLimiter rateLimiter;
    private final ActiveSessionService activeSessionService;

    public AuthResponse login(LoginRequest request) {
        rateLimiter.checkBlocked(request.getEmail());

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            rateLimiter.checkAndRegisterFailure(request.getEmail());
            throw new UnauthorizedException("Email ou mot de passe incorrect");
        }

        User user = userOpt.get();

        if (user.getStatus() == User.UserStatus.PENDING) {
            throw new UnauthorizedException("Votre compte est en attente de validation par un administrateur");
        }

        rateLimiter.resetAttempts(request.getEmail());
        activeSessionService.login(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return AuthResponse.builder()
            .user(UserDto.fromEntity(user))
            .token(token)
            .build();
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Cet email est déjà utilisé");
        }

        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .role(User.UserRole.valueOf(request.getRole().toUpperCase()))
            .organization(request.getOrganization())
            .telephone(request.getTelephone())
            .adresse(request.getAdresse())
            .status(User.UserStatus.PENDING)
            .build();

        user = userRepository.save(user);

        // Si le rôle est PRESTATAIRE, créer automatiquement l'entrée dans la table prestataires
        if (User.UserRole.PRESTATAIRE.equals(user.getRole())) {
            String nom = (request.getOrganization() != null && !request.getOrganization().isBlank())
                ? request.getOrganization()
                : request.getFullName();
            String numero = "PST-" + user.getId();
            if (!prestataireRepository.existsByNumero(numero)) {
                Prestataire prestataire = Prestataire.builder()
                    .numero(numero)
                    .nom(nom)
                    .type(Prestataire.TypePrestataire.AUTRE)
                    .telephone(request.getTelephone())
                    .email(request.getEmail())
                    .adresse(request.getAdresse())
                    .statut(Prestataire.StatutPrestataire.INACTIF)
                    .build();
                prestataireRepository.save(prestataire);
            }
        }

        // Pas de token : le compte doit être validé par un admin avant toute connexion
        return AuthResponse.builder()
            .user(UserDto.fromEntity(user))
            .token(null)
            .build();
    }

    public UserDto getCurrentUser(String email) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isEmpty()) {
            throw new UnauthorizedException("User not found");
        }
        return UserDto.fromEntity(user.get());
    }
}
