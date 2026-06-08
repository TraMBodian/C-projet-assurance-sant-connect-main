package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.Police;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.PoliceRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.PoliceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/polices")
@RequiredArgsConstructor
public class PoliceController {

    private final PoliceService policeService;
    private final UserRepository userRepository;
    private final AssureRepository assureRepository;
    private final PoliceRepository policeRepository;

    /** Endpoint paginé : GET /api/polices/paginated?page=0&size=20&sort=createdAt */
    @GetMapping("/paginated")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPolicePaginated(
            @RequestParam(defaultValue = "0")           int page,
            @RequestParam(defaultValue = "20")          int size,
            @RequestParam(defaultValue = "createdAt")   String sort,
            @RequestParam(required = false)             String search,
            @RequestParam(required = false)             String statut) {

        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, sort));
        Page<Police> result = policeService.getPolicePaginated(search, statut, pageable);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "polices",       result.getContent(),
            "totalElements", result.getTotalElements(),
            "totalPages",    result.getTotalPages(),
            "page",          result.getNumber(),
            "size",          result.getSize()
        )));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPolices(Authentication auth) {
        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        User.UserRole role = userOpt.map(User::getRole).orElse(null);

        if (role == User.UserRole.CLIENT) {
            Optional<Assure> assureOpt = assureRepository.findByEmail(email);
            if (assureOpt.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("polices", List.of())));
            }
            List<Police> polices = policeRepository.findByAssureId(assureOpt.get().getId());
            return ResponseEntity.ok(ApiResponse.success(Map.of("polices", polices)));
        }
        // R3 : domaine financier — un PRESTATAIRE n'accède pas aux contrats d'assurance
        if (role == User.UserRole.PRESTATAIRE) {
            return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        }
        // ADMIN
        List<Police> polices = policeService.getAllPolices();
        return ResponseEntity.ok(ApiResponse.success(Map.of("polices", polices)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Police>> getPoliceById(@PathVariable Long id, Authentication auth) {
        // R3 : domaine financier — un PRESTATAIRE n'accède pas aux contrats
        if (auth != null && userRepository.findByEmail(auth.getName())
                .map(u -> u.getRole() == User.UserRole.PRESTATAIRE).orElse(false)) {
            throw new AccessDeniedException("Accès refusé");
        }
        Police police = policeService.getPoliceById(id);
        // Contrôle IDOR : un client ne peut accéder qu'à ses propres polices
        if (auth != null && isClient(auth)) {
            Optional<Assure> assureOpt = assureRepository.findByEmail(auth.getName());
            boolean isOwner = assureOpt.isPresent()
                && police.getAssure() != null
                && assureOpt.get().getId().equals(police.getAssure().getId());
            if (!isOwner) {
                throw new AccessDeniedException("Accès refusé : cette police ne vous appartient pas");
            }
        }
        return ResponseEntity.ok(ApiResponse.success(police));
    }

    // ── Helpers privés ──────────────────────────────────────────────────────────

    private boolean isClient(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .map(u -> u.getRole() == User.UserRole.CLIENT)
            .orElse(false);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Police>> createPolice(@RequestBody Map<String, Object> payload) {
        Police police = new Police();
        police.setNumero((String) payload.getOrDefault("numero", "POL-" + System.currentTimeMillis()));
        police.setType((String) payload.getOrDefault("type", "FAMILLE"));
        police.setCouverture((String) payload.get("couverture"));
        if (payload.get("montantPrime") != null)
            police.setMontantPrime(new java.math.BigDecimal(payload.get("montantPrime").toString()));
        if (payload.get("statut") != null) {
            try { police.setStatut(Police.PoliceStatut.valueOf(payload.get("statut").toString())); }
            catch (IllegalArgumentException ignored) {}
        }
        // assure optionnel
        if (payload.get("assure") instanceof java.util.Map<?,?> assureMap && assureMap.get("id") != null) {
            Police created = policeService.createPolice(police, Long.parseLong(assureMap.get("id").toString()));
            return ResponseEntity.ok(ApiResponse.success(created));
        }
        Police created = policeService.createPoliceWithoutAssure(police);
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Police>> updatePolice(@PathVariable Long id, @RequestBody Police policeDetails) {
        Police updatedPolice = policeService.updatePolice(id, policeDetails);
        return ResponseEntity.ok(ApiResponse.success(updatedPolice));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePolice(@PathVariable Long id) {
        policeService.deletePolice(id);
        return ResponseEntity.ok(ApiResponse.success("Police deleted successfully"));
    }
}
