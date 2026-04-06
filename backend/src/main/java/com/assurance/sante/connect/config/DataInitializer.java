package com.assurance.sante.connect.config;

import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create default admin users if not exists
        String[] adminEmails = {"bassniang7@yahoo.fr", "bodianm372@gmail.com"};
        String defaultPassword = "admin1";

        for (String email : adminEmails) {
            // Always recreate admin users for testing
            userRepository.findByEmail(email).ifPresent(user -> {
                userRepository.delete(user);
                System.out.println("Deleted existing admin user: " + email);
            });

            User admin = User.builder()
                .email(email)
                .password(passwordEncoder.encode(defaultPassword))
                .fullName("Administrateur")
                .role(User.UserRole.ADMIN)
                .organization("Assurance Santé Connect")
                .status(User.UserStatus.ACTIVE)
                .build();

            userRepository.save(admin);
            System.out.println("Admin user created: " + email + " / " + defaultPassword);
        }
    }
}