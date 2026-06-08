package com.assurance.sante.connect.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests de sécurité — vérifie que les endpoints sensibles sont
 * correctement protégés contre les accès non authentifiés.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"h2", "test"})
@DisplayName("Security — contrôle d'accès")
public class SecurityAccessTest {

    @Autowired
    private MockMvc mockMvc;

    // ── Endpoints publics ───────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/stats/public → 200 sans auth")
    void publicStatsEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/stats/public"))
               .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/auth/login → accessible sans auth")
    void loginEndpointIsPublic() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType("application/json")
                .content("{\"email\":\"a@b.com\",\"password\":\"wrong\"}"))
               .andExpect(status().isUnauthorized()); // 401 = identifiants incorrects, pas blocage CORS
    }

    // ── Endpoints protégés — doivent retourner 401 sans token ──────────────────

    /** Spring Security 6 stateless peut retourner 401 ou 403 selon la config — les deux indiquent un accès bloqué. */
    private static void assertAccessDenied(org.springframework.test.web.servlet.MvcResult result) {
        int status = result.getResponse().getStatus();
        assertThat(status).as("Endpoint doit retourner 401 ou 403 (accès refusé)").isIn(401, 403);
    }

    @Test
    @DisplayName("GET /api/polices → accès refusé sans auth")
    void policesRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/polices")).andExpect(SecurityAccessTest::assertAccessDenied);
    }

    @Test
    @DisplayName("GET /api/polices/{id} → accès refusé sans auth")
    void policeByIdRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/polices/1")).andExpect(SecurityAccessTest::assertAccessDenied);
    }

    @Test
    @DisplayName("GET /api/sinistres → accès refusé sans auth")
    void sinistresRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/sinistres")).andExpect(SecurityAccessTest::assertAccessDenied);
    }

    @Test
    @DisplayName("GET /api/assures → accès refusé sans auth")
    void assuresRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/assures")).andExpect(SecurityAccessTest::assertAccessDenied);
    }

    @Test
    @DisplayName("GET /api/users → accès refusé sans auth")
    void usersRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(SecurityAccessTest::assertAccessDenied);
    }

    @Test
    @DisplayName("GET /api/stats/financier → accès refusé sans auth")
    void statsFinancierRequiresAuth() throws Exception {
        mockMvc.perform(get("/api/stats/financier")).andExpect(SecurityAccessTest::assertAccessDenied);
    }

    @Test
    @DisplayName("POST /api/polices → accès refusé sans auth (création réservée admin)")
    void createPoliceRequiresAuth() throws Exception {
        mockMvc.perform(post("/api/polices")
                .contentType("application/json")
                .content("{\"numero\":\"POL-TEST\"}"))
               .andExpect(SecurityAccessTest::assertAccessDenied);
    }

    @Test
    @DisplayName("DELETE /api/polices/{id} → accès refusé sans auth")
    void deletePoliceRequiresAuth() throws Exception {
        mockMvc.perform(delete("/api/polices/1")).andExpect(SecurityAccessTest::assertAccessDenied);
    }

    @Test
    @DisplayName("DELETE /api/sinistres/{id} → accès refusé sans auth")
    void deleteSinistreRequiresAuth() throws Exception {
        mockMvc.perform(delete("/api/sinistres/1")).andExpect(SecurityAccessTest::assertAccessDenied);
    }

    // ── H2 console doit être inaccessible hors profil h2 ───────────────────────

    @Test
    @DisplayName("GET /h2-console → 404 ou 403 hors profil h2")
    void h2ConsoleNotExposedInProd() throws Exception {
        mockMvc.perform(get("/h2-console"))
               .andExpect(result -> {
                   int status = result.getResponse().getStatus();
                   // Accepte 404 (pas de mapping) ou 403 (sécurité Spring)
                   assert status == 404 || status == 403
                       : "H2 console ne doit pas être accessible (statut: " + status + ")";
               });
    }

    // ── Actuator ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /actuator/health → 200 public")
    void actuatorHealthIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
               .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /actuator/env → 401 ou 404 (ne doit pas être exposé)")
    void actuatorEnvIsNotExposed() throws Exception {
        mockMvc.perform(get("/actuator/env"))
               .andExpect(result -> {
                   int status = result.getResponse().getStatus();
                   assert status == 401 || status == 403 || status == 404
                       : "actuator/env ne doit pas être exposé publiquement (statut: " + status + ")";
               });
    }
}
