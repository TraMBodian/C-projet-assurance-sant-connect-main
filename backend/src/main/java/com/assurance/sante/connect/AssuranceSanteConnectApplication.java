package com.assurance.sante.connect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class AssuranceSanteConnectApplication {

    public static void main(String[] args) {
        SpringApplication.run(AssuranceSanteConnectApplication.class, args);
    }
}
