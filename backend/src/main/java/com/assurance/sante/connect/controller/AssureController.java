package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.AssureDto;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.ConsultationRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.AssureService;
import com.assurance.sante.connect.service.MedicalAccessService;
import com.assurance.sante.connect.service.MedicalAuditService;
import com.assurance.sante.connect.security.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.List;
import java.util.Map;
import java.util.Base64;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assures")
@RequiredArgsConstructor
public class AssureController {

    private final AssureService assureService;
    private final UserRepository userRepository;
    private final AssureRepository assureRepository;
    private final ConsultationRepository consultationRepository;
    private final MedicalAccessService medicalAccessService;
    private final MedicalAuditService medicalAuditService;
    private final ClientIpResolver clientIpResolver;

    /** Champs de tri autorisés pour l'endpoint paginé (anti-injection de propriété). */
    private static final java.util.Set<String> SORTABLE =
        java.util.Set.of("nom", "prenom", "numero", "createdAt", "statut", "type");

    /** Endpoint paginé (vue d'administration) : GET /api/assures/paginated?page=0&size=20&sort=nom&search=...&statut=ACTIF&type=FAMILLE */
    @GetMapping("/paginated")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAssuresPaginated(
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size,
            @RequestParam(defaultValue = "nom")  String sort,
            @RequestParam(required = false)      String search,
            @RequestParam(required = false)      String statut,
            @RequestParam(required = false)      String type,
            Authentication auth) {
        // Anti-injection : tri restreint à une whitelist
        String sortField = SORTABLE.contains(sort) ? sort : "nom";
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(sortField));
        Page<AssureDto> result = assureService.getAssuresPaginated(search, statut, type, pageable);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "assures",       result.getContent(),
            "totalElements", result.getTotalElements(),
            "totalPages",    result.getTotalPages(),
            "page",          result.getNumber(),
            "size",          result.getSize()
        )));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllAssures(Authentication auth) {
        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);
        User.UserRole role = userOpt.map(User::getRole).orElse(null);

        if (role == User.UserRole.CLIENT) {
            Optional<Assure> assureOpt = assureRepository.findByEmail(email);
            if (assureOpt.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("assures", List.of())));
            }
            List<AssureDto> result = List.of(assureService.getAssureById(assureOpt.get().getId()));
            return ResponseEntity.ok(ApiResponse.success(Map.of("assures", result)));
        }

        if (role == User.UserRole.PRESTATAIRE) {
            // R1 : un prestataire ne voit QUE ses patients associés, jamais toute la base
            Long prestId = medicalAccessService.currentPrestataireId(auth);
            if (prestId == null) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("assures", List.of())));
            }
            java.util.Set<Long> assureIds = consultationRepository.findByPrestataireId(prestId).stream()
                .filter(c -> c.getAssure() != null)
                .map(c -> c.getAssure().getId())
                .collect(java.util.stream.Collectors.toSet());
            List<AssureDto> result = assureIds.stream()
                .map(assureService::getAssureById)
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(Map.of("assures", result)));
        }

        // ADMIN
        List<AssureDto> assures = assureService.getAllAssures();
        return ResponseEntity.ok(ApiResponse.success(Map.of("assures", assures)));
    }

    /** Retourne les bénéficiaires (famille) du client connecté, hors lui-même. */
    @GetMapping("/mes-beneficiaires")
    public ResponseEntity<ApiResponse<List<AssureDto>>> getMesBeneficiaires(Authentication auth) {
        String email = auth.getName();
        Optional<Assure> assureOpt = assureRepository.findByEmail(email);
        if (assureOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        Assure monAssure = assureOpt.get();
        Long familleId = monAssure.getFamilleId();

        // Fallback : si familleId non renseigné (données antérieures), tenter d'extraire du numéro FAM-{id}-{i}
        if (familleId == null) {
            String num = monAssure.getNumero();
            if (num != null && num.matches("FAM-\\d+-\\d+")) {
                String[] parts = num.split("-");
                try { familleId = Long.parseLong(parts[1]); } catch (NumberFormatException ignored) {}
            }
        }

        if (familleId == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }

        List<AssureDto> membres = assureRepository.findByFamilleId(familleId).stream()
                .filter(a -> !a.getId().equals(monAssure.getId()))
                .map(a -> assureService.getAssureById(a.getId()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(membres));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssureDto>> getAssureById(
            @PathVariable Long id, Authentication auth, HttpServletRequest request) {
        // R1 : un PRESTATAIRE ne peut consulter le dossier que d'un patient qui lui est associé
        if (auth != null && medicalAccessService.isPrestataire(auth)
                && !medicalAccessService.canAccessPatient(auth, id)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : ce patient ne vous est pas associé"));
        }
        if (auth != null && isClient(auth)) {
            Assure myAssure = assureRepository.findByEmail(auth.getName()).orElse(null);
            if (myAssure == null || !isFamilyMemberOrSelf(myAssure, id)) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : vous ne pouvez consulter que votre dossier ou celui de vos bénéficiaires"));
            }
        }
        AssureDto assure = assureService.getAssureById(id);
        medicalAuditService.logAccess(auth, "PATIENT", id, clientIpResolver.resolve(request));
        return ResponseEntity.ok(ApiResponse.success(assure));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssureDto>> createAssure(@RequestBody AssureDto assureDto) {
        AssureDto createdAssure = assureService.createAssure(assureDto);
        return ResponseEntity.ok(ApiResponse.success(createdAssure));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public ResponseEntity<ApiResponse<AssureDto>> updateAssure(@PathVariable Long id, @RequestBody AssureDto assureDto, Authentication auth) {
        if (auth != null && isClient(auth)) {
            Assure myAssure = assureRepository.findByEmail(auth.getName()).orElse(null);
            if (myAssure == null || !myAssure.getId().equals(id)) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : vous ne pouvez modifier que votre propre dossier"));
            }
            // Anti mass-assignment : un CLIENT ne modifie que ses coordonnées,
            // jamais les champs financiers/contractuels (prime, garantie, salaire, dates, composition).
            assureDto.setPrime(null);
            assureDto.setGarantie(null);
            assureDto.setSalaire(null);
            assureDto.setDateDebut(null);
            assureDto.setDateFin(null);
            assureDto.setDateAdhesion(null);
            assureDto.setBeneficiaires(null);
            assureDto.setEmployes(null);
            assureDto.setAssures(null);
            assureDto.setSecteur(null);
        }
        AssureDto updatedAssure = assureService.updateAssure(id, assureDto);
        return ResponseEntity.ok(ApiResponse.success(updatedAssure));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteAssure(@PathVariable Long id) {
        assureService.deleteAssure(id);
        return ResponseEntity.ok(ApiResponse.success("Assure deleted successfully"));
    }

    /** Upload photo (base64 data URL) pour un assuré. */
    @PatchMapping("/{id}/photo")
    public ResponseEntity<ApiResponse<AssureDto>> uploadPhoto(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        if (auth != null && isClient(auth)) {
            Assure myAssure = assureRepository.findByEmail(auth.getName()).orElse(null);
            if (myAssure == null || !myAssure.getId().equals(id)) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : vous ne pouvez modifier que votre propre photo"));
            }
        }
        String photo = body.get("photo");
        if (photo == null || photo.isBlank()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Champ 'photo' manquant"));
        }
        if (!photo.startsWith("data:image/")) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Format invalide : data URL image attendu"));
        }
        if (photo.length() > 3_000_000) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Image trop volumineuse (max 2 Mo)"));
        }
        AssureDto updated = assureService.updatePhoto(id, photo);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    // ── Helpers privés ──────────────────────────────────────────────────────────

    private boolean isClient(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .map(u -> u.getRole() == User.UserRole.CLIENT)
            .orElse(false);
    }

    /** Vrai si targetId == myAssure.id OU si targetId appartient à la même famille. */
    private boolean isFamilyMemberOrSelf(Assure myAssure, Long targetId) {
        if (myAssure.getId().equals(targetId)) return true;
        Long familleId = myAssure.getFamilleId();
        if (familleId == null) {
            // Fallback numéro FAM-{id}-{i}
            String num = myAssure.getNumero();
            if (num != null && num.matches("FAM-\\d+-\\d+")) {
                try { familleId = Long.parseLong(num.split("-")[1]); } catch (NumberFormatException ignored) {}
            }
        }
        if (familleId == null) return false;
        return assureRepository.findByFamilleId(familleId).stream()
            .anyMatch(a -> a.getId().equals(targetId));
    }
}
