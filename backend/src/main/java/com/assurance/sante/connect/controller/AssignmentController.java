package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.AssignmentDto;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.PatientProviderAssignment;
import com.assurance.sante.connect.entity.PatientProviderAssignment.AssignmentSource;
import com.assurance.sante.connect.entity.PatientProviderAssignment.AssignmentStatus;
import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.PatientProviderAssignmentRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.service.MedicalAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Gestion des relations patient ↔ prestataire (R2).
 *
 * Règle fondamentale : un PRESTATAIRE ne peut JAMAIS activer une assignation
 * lui-même. Seul un ADMIN (ADMIN_GRANT) ou le PATIENT concerné (PATIENT_CONSENT)
 * peut la passer à ACTIVE.
 */
@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final PatientProviderAssignmentRepository assignmentRepository;
    private final AssureRepository assureRepository;
    private final PrestataireRepository prestataireRepository;
    private final MedicalAccessService medicalAccessService;

    // ── Lecture (scopée par rôle) ───────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<AssignmentDto>>> list(Authentication auth) {
        List<PatientProviderAssignment> rows;
        if (medicalAccessService.isAdmin(auth)) {
            rows = assignmentRepository.findAll();
        } else if (medicalAccessService.isPrestataire(auth)) {
            Long prestId = medicalAccessService.currentPrestataireId(auth);
            rows = prestId == null ? List.of() : assignmentRepository.findByPrestataireId(prestId);
        } else { // CLIENT
            Long assureId = medicalAccessService.currentAssureId(auth);
            rows = assureId == null ? List.of() : assignmentRepository.findByAssureId(assureId);
        }
        return ResponseEntity.ok(ApiResponse.success(
            rows.stream().map(AssignmentDto::fromEntity).collect(Collectors.toList())));
    }

    // ── ADMIN : octroi direct ────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentDto>> grant(@RequestBody Map<String, Object> body, Authentication auth) {
        Long assureId = toLong(body.get("assureId"));
        Long prestataireId = toLong(body.get("prestataireId"));
        if (assureId == null || prestataireId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("assureId et prestataireId requis"));
        }
        Assure assure = assureRepository.findById(assureId).orElse(null);
        Prestataire prestataire = prestataireRepository.findById(prestataireId).orElse(null);
        if (assure == null || prestataire == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Assuré ou prestataire introuvable"));
        }
        PatientProviderAssignment a = upsert(assure, prestataire,
            AssignmentStatus.ACTIVE, AssignmentSource.ADMIN_GRANT, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(AssignmentDto.fromEntity(a)));
    }

    // ── PRESTATAIRE : demande de consentement (PENDING) ──────────────────────────

    @PostMapping("/request")
    @PreAuthorize("hasRole('PRESTATAIRE')")
    public ResponseEntity<ApiResponse<AssignmentDto>> request(@RequestBody Map<String, Object> body, Authentication auth) {
        Long assureId = toLong(body.get("assureId"));
        if (assureId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("assureId requis"));
        }
        Long prestId = medicalAccessService.currentPrestataireId(auth);
        if (prestId == null) {
            return ResponseEntity.status(403).body(ApiResponse.error("Aucun prestataire rattaché à votre compte"));
        }
        Assure assure = assureRepository.findById(assureId).orElse(null);
        Prestataire prestataire = prestataireRepository.findById(prestId).orElse(null);
        if (assure == null || prestataire == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Assuré introuvable"));
        }
        // Ne jamais écraser une assignation déjà ACTIVE
        Optional<PatientProviderAssignment> existing =
            assignmentRepository.findByPrestataireIdAndAssureId(prestId, assureId);
        if (existing.isPresent() && existing.get().getStatus() == AssignmentStatus.ACTIVE) {
            return ResponseEntity.ok(ApiResponse.success(AssignmentDto.fromEntity(existing.get())));
        }
        PatientProviderAssignment a = upsert(assure, prestataire,
            AssignmentStatus.PENDING, AssignmentSource.PATIENT_CONSENT, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(AssignmentDto.fromEntity(a)));
    }

    // ── PATIENT (CLIENT) : accepte / refuse une demande le concernant ────────────

    @PutMapping("/{id}/accept")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<AssignmentDto>> accept(@PathVariable Long id, Authentication auth) {
        return decideAsPatient(id, auth, AssignmentStatus.ACTIVE);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<AssignmentDto>> reject(@PathVariable Long id, Authentication auth) {
        return decideAsPatient(id, auth, AssignmentStatus.REVOKED);
    }

    // ── Révocation (ADMIN ou le PATIENT concerné) ────────────────────────────────

    @PutMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('ADMIN', 'CLIENT')")
    public ResponseEntity<ApiResponse<AssignmentDto>> revoke(@PathVariable Long id, Authentication auth) {
        PatientProviderAssignment a = assignmentRepository.findById(id).orElse(null);
        if (a == null) return ResponseEntity.notFound().build();
        if (!medicalAccessService.isAdmin(auth) && !isOwningPatient(a, auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        }
        a.setStatus(AssignmentStatus.REVOKED);
        a.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.success(AssignmentDto.fromEntity(assignmentRepository.save(a))));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private ResponseEntity<ApiResponse<AssignmentDto>> decideAsPatient(
            Long id, Authentication auth, AssignmentStatus newStatus) {
        PatientProviderAssignment a = assignmentRepository.findById(id).orElse(null);
        if (a == null) return ResponseEntity.notFound().build();
        if (!isOwningPatient(a, auth)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : cette demande ne vous concerne pas"));
        }
        a.setStatus(newStatus);
        a.setUpdatedAt(LocalDateTime.now());
        if (newStatus == AssignmentStatus.ACTIVE && a.getValidFrom() == null) {
            a.setValidFrom(LocalDateTime.now());
        }
        return ResponseEntity.ok(ApiResponse.success(AssignmentDto.fromEntity(assignmentRepository.save(a))));
    }

    /** Vrai si l'assignation concerne l'assuré rattaché au CLIENT connecté. */
    private boolean isOwningPatient(PatientProviderAssignment a, Authentication auth) {
        Long myAssureId = medicalAccessService.currentAssureId(auth);
        return myAssureId != null && a.getAssure() != null && myAssureId.equals(a.getAssure().getId());
    }

    /** Crée ou met à jour l'assignation unique (assure, prestataire). */
    private PatientProviderAssignment upsert(Assure assure, Prestataire prestataire,
                                             AssignmentStatus status, AssignmentSource source, String actor) {
        PatientProviderAssignment a = assignmentRepository
            .findByPrestataireIdAndAssureId(prestataire.getId(), assure.getId())
            .orElseGet(PatientProviderAssignment::new);
        a.setAssure(assure);
        a.setPrestataire(prestataire);
        a.setStatus(status);
        a.setSource(source);
        a.setGrantedByEmail(actor);
        if (status == AssignmentStatus.ACTIVE && a.getValidFrom() == null) {
            a.setValidFrom(LocalDateTime.now());
        }
        if (a.getCreatedAt() == null) a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        return assignmentRepository.save(a);
    }

    private Long toLong(Object o) {
        if (o == null) return null;
        try { return Long.valueOf(o.toString()); } catch (NumberFormatException e) { return null; }
    }
}
