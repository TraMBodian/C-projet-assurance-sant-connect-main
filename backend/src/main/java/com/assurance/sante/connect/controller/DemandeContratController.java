package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.DemandeContrat;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.DemandeContratService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/demandes-contrat")
@RequiredArgsConstructor
public class DemandeContratController {

    private final DemandeContratService service;
    private final UserRepository userRepository;

    /** CLIENT → ses propres demandes ; ADMIN → toutes */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DemandeContrat>>> getAll(Authentication auth) {
        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.ADMIN) {
            return ResponseEntity.ok(ApiResponse.success(service.getAll()));
        }
        return ResponseEntity.ok(ApiResponse.success(service.getByAssure(email)));
    }

    /** Demandes en attente (ADMIN uniquement) */
    @GetMapping("/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<DemandeContrat>>> getEnAttente() {
        return ResponseEntity.ok(ApiResponse.success(service.getEnAttente()));
    }

    /** CLIENT soumet une demande */
    @PostMapping
    public ResponseEntity<ApiResponse<DemandeContrat>> creer(
            @RequestBody Map<String, Object> payload,
            Authentication auth) {
        DemandeContrat created = service.creer(payload, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(created));
    }

    /** ADMIN approuve */
    @PutMapping("/{id}/approuver")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DemandeContrat>> approuver(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String commentaire = body != null ? (String) body.getOrDefault("commentaire", "") : "";
        return ResponseEntity.ok(ApiResponse.success(service.approuver(id, commentaire)));
    }

    /** ADMIN refuse */
    @PutMapping("/{id}/refuser")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DemandeContrat>> refuser(
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
        return ResponseEntity.ok(ApiResponse.success("Demande supprimée"));
    }
}
