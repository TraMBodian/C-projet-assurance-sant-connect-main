package com.assurance.sante.connect.config;

import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_EMAILS:bassniang7@yahoo.fr,bodianm372@gmail.com}")
    private String adminEmailsConfig;

    @Value("${ADMIN_DEFAULT_PASSWORD:admin1}")
    private String defaultPassword;

    @Override
    public void run(String... args) throws Exception {
        String[] adminEmails = adminEmailsConfig.split(",");

        for (String email : adminEmails) {
            String trimmedEmail = email.trim();
            var existing = userRepository.findByEmail(trimmedEmail);
            if (existing.isPresent()) {
                User admin = existing.get();
                admin.setPassword(passwordEncoder.encode(defaultPassword));
                admin.setStatus(User.UserStatus.ACTIVE);
                admin.setRole(User.UserRole.ADMIN);
                userRepository.save(admin);
                log.info("Admin user updated: {}", trimmedEmail);
            } else {
                User admin = User.builder()
                    .email(trimmedEmail)
                    .password(passwordEncoder.encode(defaultPassword))
                    .fullName("Administrateur")
                    .role(User.UserRole.ADMIN)
                    .organization("Assurance Santé Connect")
                    .status(User.UserStatus.ACTIVE)
                    .build();
                userRepository.save(admin);
                log.info("Admin user created: {}", trimmedEmail);
            }
        }
    }
}
