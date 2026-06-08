package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.ConsultationDto;
import com.assurance.sante.connect.dto.CreateConsultationRequest;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.Consultation;
import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.ConsultationRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.ConsultationService;
import com.assurance.sante.connect.service.MedicalAccessService;
import com.assurance.sante.connect.service.MedicalAuditService;
import com.assurance.sante.connect.security.ClientIpResolver;
import com.assurance.sante.connect.service.RealtimeNotificationService;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;
    private final UserRepository userRepository;
    private final AssureRepository assureRepository;
    private final PrestataireRepository prestataireRepository;
    private final ConsultationRepository consultationRepository;
    private final RealtimeNotificationService realtimeNotificationService;
    private final MedicalAccessService medicalAccessService;
    private final MedicalAuditService medicalAuditService;
    private final ClientIpResolver clientIpResolver;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllConsultations(
            Authentication auth,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "100") int size) {

        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        List<ConsultationDto> consultations;

        if (userOpt.isPresent()) {
            User.UserRole role = userOpt.get().getRole();

            if (role == User.UserRole.CLIENT) {
                Optional<Assure> assureOpt = assureRepository.findByEmail(email);
                if (assureOpt.isEmpty()) {
                    return ResponseEntity.ok(ApiResponse.success(Map.of("consultations", List.of())));
                }
                consultations = consultationRepository.findByAssureId(assureOpt.get().getId())
                    .stream().map(ConsultationDto::fromEntity).collect(Collectors.toList());
                return ResponseEntity.ok(ApiResponse.success(Map.of("consultations", consultations)));
            }

            if (role == User.UserRole.PRESTATAIRE) {
                Optional<Prestataire> prestOpt = prestataireRepository.findFirstByEmail(email);
                if (prestOpt.isEmpty()) {
                    return ResponseEntity.ok(ApiResponse.success(Map.of("consultations", List.of())));
                }
                consultations = consultationRepository.findByPrestataireId(prestOpt.get().getId())
                    .stream().map(ConsultationDto::fromEntity).collect(Collectors.toList());
                return ResponseEntity.ok(ApiResponse.success(Map.of("consultations", consultations)));
            }
        }

        // ADMIN : toutes les consultations (paginées si page > 0 ou size < 100)
        var pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var pageResult  = consultationRepository.findAll(pageRequest);
        consultations   = pageResult.getContent().stream().map(ConsultationDto::fromEntity).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("consultations", consultations);
        result.put("pagination", Map.of(
            "page",       pageResult.getNumber(),
            "size",       pageResult.getSize(),
            "total",      pageResult.getTotalElements(),
            "totalPages", pageResult.getTotalPages()
        ));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConsultationDto>> getConsultationById(
            @PathVariable Long id, Authentication auth, HttpServletRequest request) {
        Consultation consultation = consultationService.getConsultationById(id);
        // Contrôle d'accès centralisé : ADMIN, CLIENT propriétaire, ou PRESTATAIRE associé
        if (!medicalAccessService.canAccessConsultation(auth, consultation)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : cette consultation ne vous est pas accessible"));
        }
        medicalAuditService.logAccess(auth, "CONSULTATION", id, clientIpResolver.resolve(request));
        return ResponseEntity.ok(ApiResponse.success(ConsultationDto.fromEntity(consultation)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<ConsultationDto>> createConsultation(
            @Valid @RequestBody CreateConsultationRequest request, Authentication auth) {

        // Vérification suspension prestataire
        if (auth != null) {
            Optional<User> userOpt = userRepository.findByEmail(auth.getName());
            if (userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.PRESTATAIRE) {
                Optional<Prestataire> prestOpt = prestataireRepository.findFirstByEmail(auth.getName());
                if (prestOpt.isPresent() && prestOpt.get().getStatut() == Prestataire.StatutPrestataire.SUSPENDU) {
                    return ResponseEntity.status(403)
                        .body(ApiResponse.error("Votre compte prestataire est suspendu."));
                }
            }
        }

        // Construire l'entité à partir du DTO validé
        Consultation consultation = new Consultation();
        assureRepository.findById(request.getAssureId()).ifPresent(consultation::setAssure);

        // Anti auto-association : un PRESTATAIRE ne peut créer une consultation QUE pour
        // lui-même. Le prestataireId du payload est ignoré et remplacé par son identité.
        Long prestataireId = request.getPrestataireId();
        if (auth != null && medicalAccessService.isPrestataire(auth)) {
            Long selfId = medicalAccessService.currentPrestataireId(auth);
            if (selfId == null) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Aucun prestataire n'est rattaché à votre compte"));
            }
            // R2 : interdiction de l'auto-association — le patient doit être assigné au prestataire
            if (!medicalAccessService.canAccessPatient(auth, request.getAssureId())) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : ce patient ne vous est pas assigné. "
                        + "Une assignation (admin ou consentement du patient) est requise."));
            }
            prestataireId = selfId;
        }
        if (prestataireId != null) {
            prestataireRepository.findById(prestataireId).ifPresent(consultation::setPrestataire);
        }
        if (request.getMotif() != null)              consultation.setMotif(request.getMotif());
        if (request.getDiagnostic() != null)         consultation.setDiagnostic(request.getDiagnostic());
        if (request.getDateConsultation() != null)   consultation.setDateConsultation(request.getDateConsultation());
        if (request.getStatut() != null) {
            try { consultation.setStatut(Consultation.ConsultationStatut.valueOf(request.getStatut())); }
            catch (IllegalArgumentException ignored) {}
        }

        Consultation created = consultationService.createConsultation(consultation);

        // Notifier le prestataire assigné en temps réel
        if (created.getPrestataire() != null) {
            String assureNom = created.getAssure() != null
                ? created.getAssure().getNom() + " " + created.getAssure().getPrenom()
                : "un assuré";
            realtimeNotificationService.notifyPrestataire(
                created.getPrestataire().getId(),
                "nouvelle_consultation",
                "Nouvelle consultation pour " + assureNom,
                "/consultations"
            );
        }

        return ResponseEntity.ok(ApiResponse.success(ConsultationDto.fromEntity(created)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<ConsultationDto>> updateConsultation(
            @PathVariable Long id, @RequestBody Consultation consultationDetails, Authentication auth) {
        // BOLA écriture : un PRESTATAIRE ne modifie que SA consultation
        if (!medicalAccessService.canWriteConsultation(auth, id)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : cette consultation ne vous est pas modifiable"));
        }
        return ResponseEntity.ok(ApiResponse.success(
            ConsultationDto.fromEntity(consultationService.updateConsultation(id, consultationDetails))));
    }

    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<ConsultationDto>> updateStatut(
            @PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        // BOLA écriture : un PRESTATAIRE ne modifie que SA consultation
        if (!medicalAccessService.canWriteConsultation(auth, id)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : cette consultation ne vous est pas modifiable"));
        }
        String statutStr = body.get("statut");
        if (statutStr == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Statut requis"));
        }
        Consultation.ConsultationStatut statut;
        try {
            statut = Consultation.ConsultationStatut.valueOf(statutStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Statut invalide: " + statutStr));
        }
        Consultation updated = consultationService.updateStatut(id, statut, body.get("motifAnnulation"));
        return ResponseEntity.ok(ApiResponse.success(ConsultationDto.fromEntity(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteConsultation(@PathVariable Long id) {
        consultationService.deleteConsultation(id);
        return ResponseEntity.ok(ApiResponse.success("Consultation supprimée"));
    }

    // ── Helpers privés ──────────────────────────────────────────────────────────

    private boolean isClient(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .map(u -> u.getRole() == User.UserRole.CLIENT)
            .orElse(false);
    }
}
