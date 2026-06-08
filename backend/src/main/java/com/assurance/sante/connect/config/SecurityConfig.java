package com.assurance.sante.connect.config;

import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.security.JwtAuthenticationFilter;
import com.assurance.sante.connect.security.JwtTokenProvider;
import com.assurance.sante.connect.service.ActiveSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final ActiveSessionService activeSessionService;
    private final UserRepository userRepository;
    private final Environment environment;

    @Value("${ALLOWED_ORIGINS:http://localhost:5173,http://localhost:3000,http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:8083,https://papservicesassurances.vercel.app,https://papservicesassurances-suxa.vercel.app}")
    private String allowedOriginsConfig;

    /** Vrai uniquement si le profil actif est "h2" (développement local). */
    private boolean isH2Profile() {
        return Arrays.asList(environment.getActiveProfiles()).contains("h2");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // Endpoints publics (vérification QR) — whitelist identique aux origines configurées
        // On n'utilise plus le wildcard "*" pour éviter l'abus cross-origin
        List<String> publicOrigins = Arrays.stream(allowedOriginsConfig.split(","))
            .map(String::trim)
            .collect(Collectors.toList());
        CorsConfiguration publicConfig = new CorsConfiguration();
        publicConfig.setAllowedOrigins(publicOrigins);
        publicConfig.setAllowedMethods(Arrays.asList("GET", "OPTIONS"));
        publicConfig.setAllowedHeaders(Arrays.asList("Content-Type", "Accept"));
        publicConfig.setMaxAge(3600L);
        source.registerCorsConfiguration("/api/public/**", publicConfig);

        // Endpoints protégés — limités aux origines configurées
        List<String> origins = Arrays.stream(allowedOriginsConfig.split(","))
            .map(String::trim)
            .collect(Collectors.toList());
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Cookie"));
        configuration.setExposedHeaders(List.of("Set-Cookie"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CSRF disabled: stateless JWT API, no session cookies
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> {
                var matcher = authz
                    .requestMatchers(
                        "/api/auth/login",
                        "/api/auth/register",
                        "/api/auth/logout",
                        "/api/auth/refresh",
                        "/api/auth/forgot-password",
                        "/api/auth/verify-otp",
                        "/api/auth/reset-password",
                        "/api/public/**",
                        "/api/photos/**",
                        "/api/stats/public",
                        "/ws/**",
                        "/actuator/health"
                    ).permitAll();
                // H2 console uniquement en développement local (profil h2)
                if (isH2Profile()) {
                    matcher.requestMatchers("/h2-console/**").permitAll();
                }
                matcher.anyRequest().authenticated();
            })
            .headers(headers -> {
                if (isH2Profile()) {
                    // En dev H2 : désactiver X-Frame-Options pour la console H2 (iframe)
                    headers.frameOptions(frame -> frame.disable());
                } else {
                    // En production : headers de sécurité complets
                    headers
                        // HSTS : forcer HTTPS pendant 1 an, inclure sous-domaines
                        .httpStrictTransportSecurity(hsts -> hsts
                            .includeSubDomains(true)
                            .maxAgeInSeconds(31_536_000))
                        // X-Frame-Options : interdire l'intégration en iframe
                        .frameOptions(frame -> frame.deny())
                        // X-Content-Type-Options : nosniff (ajouté par Spring par défaut aussi)
                        .contentTypeOptions(cto -> {})
                        // Content-Security-Policy : restreindre les sources de scripts
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                            "default-src 'self'; " +
                            "script-src 'self'; " +
                            "style-src 'self' 'unsafe-inline'; " +
                            "img-src 'self' data: blob:; " +
                            "font-src 'self'; " +
                            "connect-src 'self'; " +
                            "frame-ancestors 'none';"
                        ))
                        // Referrer-Policy : ne pas transmettre l'URL de référence
                        .referrerPolicy(ref -> ref.policy(
                            org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER));
                }
            })
            .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider, activeSessionService, userRepository), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}
