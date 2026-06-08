package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.AvenantContrat;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.AvenantContratService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/avenants-contrat")
@RequiredArgsConstructor
public class AvenantContratController {

    private final AvenantContratService service;
    private final UserRepository userRepository;

    /** CLIENT → ses avenants ; ADMIN → tous */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AvenantContrat>>> getAll(Authentication auth) {
        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.ADMIN) {
            return ResponseEntity.ok(ApiResponse.success(service.getAll()));
        }
        return ResponseEntity.ok(ApiResponse.success(service.getByAssure(email)));
    }

    /** Avenants en attente (ADMIN) */
    @GetMapping("/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AvenantContrat>>> getEnAttente() {
        return ResponseEntity.ok(ApiResponse.success(service.getEnAttente()));
    }

    /** Avenants d'une police — admin uniquement (évite l'IDOR inter-clients) */
    @GetMapping("/police/{policeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AvenantContrat>>> getByPolice(@PathVariable Long policeId) {
        return ResponseEntity.ok(ApiResponse.success(service.getByPolice(policeId)));
    }

    /** CLIENT soumet un avenant */
    @PostMapping
    public ResponseEntity<ApiResponse<AvenantContrat>> creer(
            @RequestBody Map<String, Object> payload,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.creer(payload, auth.getName())));
    }

    /** ADMIN approuve et applique */
    @PutMapping("/{id}/approuver")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AvenantContrat>> approuver(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String commentaire = body != null ? (String) body.getOrDefault("commentaire", "") : "";
        return ResponseEntity.ok(ApiResponse.success(service.approuver(id, commentaire)));
    }

    /** ADMIN refuse */
    @PutMapping("/{id}/refuser")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AvenantContrat>> refuser(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String commentaire = body != null ? (String) body.getOrDefault("commentaire", "") : "";
        return ResponseEntity.ok(ApiResponse.success(service.refuser(id, commentaire)));
    }

    /** ADMIN supprime */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> supprimer(@PathVariable Long id) {
        service.supprimer(id);
        return ResponseEntity.ok(ApiResponse.success("Avenant supprimé"));
    }
}
