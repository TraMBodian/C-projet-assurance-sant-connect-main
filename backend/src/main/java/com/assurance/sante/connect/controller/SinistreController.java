package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.CreateSinistreRequest;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.Sinistre;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.SinistreRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.SinistreService;
import com.assurance.sante.connect.service.MedicalAccessService;
import com.assurance.sante.connect.service.MedicalAuditService;
import com.assurance.sante.connect.security.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/sinistres")
@RequiredArgsConstructor
public class SinistreController {

    private final SinistreService sinistreService;
    private final UserRepository userRepository;
    private final AssureRepository assureRepository;
    private final SinistreRepository sinistreRepository;
    private final MedicalAccessService medicalAccessService;
    private final MedicalAuditService medicalAuditService;
    private final ClientIpResolver clientIpResolver;

    /** Rate limiter : max 5 déclarations de sinistres par compte et par heure. */
    private final ConcurrentHashMap<String, List<Long>> rateLimitMap = new ConcurrentHashMap<>();
    private static final int    RATE_LIMIT_MAX    = 5;
    private static final long   RATE_LIMIT_WINDOW = 3_600_000L; // 1 heure en ms

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllSinistres(Authentication auth) {
        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        User.UserRole role = userOpt.map(User::getRole).orElse(null);

        if (role == User.UserRole.CLIENT) {
            Optional<Assure> assureOpt = assureRepository.findByEmail(email);
            if (assureOpt.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("sinistres", List.of())));
            }
            List<Sinistre> sinistres = sinistreRepository.findByAssureId(assureOpt.get().getId());
            return ResponseEntity.ok(ApiResponse.success(Map.of("sinistres", sinistres)));
        }

        if (role == User.UserRole.PRESTATAIRE) {
            // Un prestataire ne voit QUE les sinistres de ses patients ASSIGNÉS (ownership réel).
            java.util.Set<Long> assureIds = medicalAccessService.assignedPatientIds(auth);
            if (assureIds.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("sinistres", List.of())));
            }
            List<Sinistre> sinistres = sinistreService.getAllSinistres().stream()
                .filter(s -> s.getAssure() != null && assureIds.contains(s.getAssure().getId()))
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(Map.of("sinistres", sinistres)));
        }

        // ADMIN
        List<Sinistre> sinistres = sinistreService.getAllSinistres();
        return ResponseEntity.ok(ApiResponse.success(Map.of("sinistres", sinistres)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Sinistre>> getSinistreById(
            @PathVariable Long id, Authentication auth, HttpServletRequest request) {
        Sinistre sinistre = sinistreService.getSinistreById(id);
        // Contrôle d'accès centralisé : ADMIN, CLIENT propriétaire, ou PRESTATAIRE associé au patient
        if (!medicalAccessService.canAccessSinistre(auth, sinistre)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : ce sinistre ne vous est pas accessible"));
        }
        medicalAuditService.logAccess(auth, "SINISTRE", id, clientIpResolver.resolve(request));
        return ResponseEntity.ok(ApiResponse.success(sinistre));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Sinistre>> createSinistre(
            @Valid @RequestBody CreateSinistreRequest request,
            Authentication auth) {
        if (auth != null) {
            ResponseEntity<ApiResponse<Sinistre>> rateLimitResponse = enforceRateLimit(auth.getName());
            if (rateLimitResponse != null) return rateLimitResponse;

            // CRITIQUE 5 — Anti-usurpation : un CLIENT ne peut déclarer un sinistre que pour LUI-MÊME.
            // On ignore l'assureId transmis et on force l'assuré rattaché au compte connecté.
            if (medicalAccessService.isClient(auth)) {
                Long myAssureId = medicalAccessService.currentAssureId(auth);
                if (myAssureId == null) {
                    return ResponseEntity.status(403)
                        .body(ApiResponse.error("Aucun dossier assuré n'est rattaché à votre compte"));
                }
                request.setAssureId(myAssureId);
            }
        }
        Sinistre createdSinistre = sinistreService.createSinistre(request);
        return ResponseEntity.ok(ApiResponse.success(createdSinistre));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Sinistre>> updateSinistre(@PathVariable Long id, @RequestBody Sinistre sinistreDetails) {
        Sinistre updatedSinistre = sinistreService.updateSinistre(id, sinistreDetails);
        return ResponseEntity.ok(ApiResponse.success(updatedSinistre));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteSinistre(@PathVariable Long id) {
        sinistreService.deleteSinistre(id);
        return ResponseEntity.ok(ApiResponse.success("Sinistre deleted successfully"));
    }

    /** Workflow : changement de statut + montant accordé (admin uniquement) */
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Sinistre>> updateStatut(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Sinistre sinistre = sinistreRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Sinistre introuvable: " + id));

        Object statutRaw = body.get("statut");
        if (statutRaw != null) {
            try {
                sinistre.setStatut(Sinistre.SinistreStatut.valueOf(statutRaw.toString()));
            } catch (IllegalArgumentException ignored) {}
        }
        Object montantRaw = body.get("montantAccorde");
        if (montantRaw != null) {
            try {
                sinistre.setMontantAccorde(new BigDecimal(montantRaw.toString()));
            } catch (NumberFormatException ignored) {}
        }
        Object notesRaw = body.get("notes");
        if (notesRaw != null) {
            sinistre.setDescription(sinistre.getDescription() != null
                ? sinistre.getDescription() + "\n[Admin] " + notesRaw
                : "[Admin] " + notesRaw);
        }
        sinistre.setUpdatedAt(java.time.LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success(sinistreRepository.save(sinistre)));
    }

    // ── Helpers privés ──────────────────────────────────────────────────────────

    /**
     * Vérifie le rate limit : max RATE_LIMIT_MAX déclarations par RATE_LIMIT_WINDOW ms.
     * Retourne null si la requête est autorisée, ou une ResponseEntity 429 si dépassé.
     */
    private ResponseEntity<ApiResponse<Sinistre>> enforceRateLimit(String email) {
        long now = System.currentTimeMillis();
        List<Long> timestamps = rateLimitMap.computeIfAbsent(email, k -> new ArrayList<>());
        synchronized (timestamps) {
            timestamps.removeIf(t -> now - t > RATE_LIMIT_WINDOW);
            if (timestamps.size() >= RATE_LIMIT_MAX) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error(
                        "Limite atteinte : maximum " + RATE_LIMIT_MAX
                        + " déclarations de sinistres par heure. Veuillez réessayer plus tard."));
            }
            timestamps.add(now);
        }
        return null;
    }
}
