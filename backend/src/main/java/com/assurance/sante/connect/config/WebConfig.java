package com.assurance.sante.connect.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// CORS is handled by SecurityConfig.corsConfigurationSource()
@Configuration
public class WebConfig implements WebMvcConfigurer {
}
