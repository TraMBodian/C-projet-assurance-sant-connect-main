package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.PaiementPrime;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.PaiementPrimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/paiements-primes")
@RequiredArgsConstructor
public class PaiementPrimeController {

    private final PaiementPrimeService service;
    private final UserRepository       userRepository;
    private final AssureRepository     assureRepository;

    /**
     * GET /api/paiements-primes
     * - ADMIN/PRESTATAIRE : tous les paiements
     * - CLIENT : uniquement ses propres paiements
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaiementPrime>>> getAll(Authentication auth) {
        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        User.UserRole role = userOpt.map(User::getRole).orElse(null);

        if (role == User.UserRole.CLIENT) {
            Optional<Assure> assureOpt = assureRepository.findByEmail(email);
            if (assureOpt.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(List.of()));
            }
            return ResponseEntity.ok(ApiResponse.success(
                    service.getByAssure(assureOpt.get().getId())));
        }
        // R3 : domaine financier — un PRESTATAIRE n'accède pas aux paiements
        if (role == User.UserRole.PRESTATAIRE) {
            return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        }
        // ADMIN
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    /** GET /api/paiements-primes/{id} — ownership requis pour les clients */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaiementPrime>> getById(
            @PathVariable Long id, Authentication auth) {
        // R3 : domaine financier — un PRESTATAIRE n'accède pas aux paiements
        if (auth != null && userRepository.findByEmail(auth.getName())
                .map(u -> u.getRole() == User.UserRole.PRESTATAIRE).orElse(false)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        }
        PaiementPrime paiement = service.getById(id);
        if (auth != null && isClient(auth)) {
            Assure myAssure = assureRepository.findByEmail(auth.getName()).orElse(null);
            boolean isOwner = myAssure != null
                && paiement.getAssure() != null
                && myAssure.getId().equals(paiement.getAssure().getId());
            if (!isOwner) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : ce paiement ne vous appartient pas"));
            }
        }
        return ResponseEntity.ok(ApiResponse.success(paiement));
    }

    /** GET /api/paiements-primes/police/{policeId} — admin uniquement (évite l'IDOR inter-clients) */
    @GetMapping("/police/{policeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PaiementPrime>>> getByPolice(@PathVariable Long policeId) {
        return ResponseEntity.ok(ApiResponse.success(service.getByPolice(policeId)));
    }

    /** GET /api/paiements-primes/en-retard — admin uniquement */
    @GetMapping("/en-retard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PaiementPrime>>> getEnRetard() {
        return ResponseEntity.ok(ApiResponse.success(service.getEnRetard()));
    }

    /** POST /api/paiements-primes — créer un paiement (admin) */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaiementPrime>> creer(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success(service.creer(data)));
    }

    /** PUT /api/paiements-primes/{id}/payer — enregistrer le paiement (admin) */
    @PutMapping("/{id}/payer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaiementPrime>> payer(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success(service.enregistrerPaiement(id, data)));
    }

    /** PUT /api/paiements-primes/{id}/retard — marquer en retard (admin) */
    @PutMapping("/{id}/retard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaiementPrime>> retard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.marquerEnRetard(id)));
    }

    /** DELETE /api/paiements-primes/{id} */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> supprimer(@PathVariable Long id) {
        service.supprimer(id);
        return ResponseEntity.ok(ApiResponse.success("Paiement supprimé"));
    }

    private boolean isClient(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .map(u -> u.getRole() == User.UserRole.CLIENT)
            .orElse(false);
    }
}
