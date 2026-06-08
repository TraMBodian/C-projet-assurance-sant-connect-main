package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.CreatePrescriptionRequest;
import com.assurance.sante.connect.dto.PrescriptionDto;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.Consultation;
import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.entity.Prescription;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.ConsultationRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.PrescriptionRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.PrescriptionService;
import com.assurance.sante.connect.service.MedicalAccessService;
import com.assurance.sante.connect.service.MedicalAuditService;
import com.assurance.sante.connect.security.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final UserRepository userRepository;
    private final AssureRepository assureRepository;
    private final PrestataireRepository prestataireRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ConsultationRepository consultationRepository;
    private final MedicalAccessService medicalAccessService;
    private final MedicalAuditService medicalAuditService;
    private final ClientIpResolver clientIpResolver;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPrescriptions(
            Authentication auth,
            @RequestParam(required = false) Long assureId) {
        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        // Filtre par assureId (utilisé par les pharmaciens pour trouver les ordonnances d'un assuré)
        if (assureId != null && userOpt.isPresent()
                && userOpt.get().getRole() != User.UserRole.CLIENT) {
            // BOLA : un prestataire ne peut filtrer que sur un patient qui lui est associé
            if (!medicalAccessService.canAccessPatient(auth, assureId)) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : ce patient ne vous est pas associé"));
            }
            List<PrescriptionDto> dtos = prescriptionRepository
                .findByConsultationAssureId(assureId)
                .stream().map(PrescriptionDto::fromEntity).collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success(Map.of("prescriptions", dtos)));
        }

        if (userOpt.isPresent()) {
            User.UserRole role = userOpt.get().getRole();

            if (role == User.UserRole.CLIENT) {
                Optional<Assure> assureOpt = assureRepository.findByEmail(email);
                if (assureOpt.isEmpty()) {
                    return ResponseEntity.ok(ApiResponse.success(Map.of("prescriptions", List.of())));
                }
                List<PrescriptionDto> dtos = prescriptionRepository
                    .findByConsultationAssureId(assureOpt.get().getId())
                    .stream().map(PrescriptionDto::fromEntity).collect(Collectors.toList());
                return ResponseEntity.ok(ApiResponse.success(Map.of("prescriptions", dtos)));
            }

            if (role == User.UserRole.PRESTATAIRE) {
                Optional<Prestataire> prestOpt = prestataireRepository.findFirstByEmail(email);
                if (prestOpt.isEmpty()) {
                    return ResponseEntity.ok(ApiResponse.success(Map.of("prescriptions", List.of())));
                }
                List<PrescriptionDto> dtos = prescriptionRepository
                    .findByConsultationPrestataireId(prestOpt.get().getId())
                    .stream().map(PrescriptionDto::fromEntity).collect(Collectors.toList());
                return ResponseEntity.ok(ApiResponse.success(Map.of("prescriptions", dtos)));
            }
        }

        // ADMIN : toutes les prescriptions
        List<PrescriptionDto> dtos = prescriptionService.getAllPrescriptions()
            .stream().map(PrescriptionDto::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(Map.of("prescriptions", dtos)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PrescriptionDto>> getPrescriptionById(
            @PathVariable Long id, Authentication auth, HttpServletRequest request) {
        Prescription prescription = prescriptionService.getPrescriptionById(id);
        // Contrôle d'accès centralisé : ADMIN, CLIENT propriétaire, prescripteur ou prestataire associé
        if (!medicalAccessService.canAccessPrescription(auth, prescription)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : cette ordonnance ne vous est pas accessible"));
        }
        medicalAuditService.logAccess(auth, "PRESCRIPTION", id, clientIpResolver.resolve(request));
        return ResponseEntity.ok(ApiResponse.success(PrescriptionDto.fromEntity(prescription)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<PrescriptionDto>> createPrescription(
            @Valid @RequestBody CreatePrescriptionRequest request, Authentication auth) {

        // Anti auto-association : un PRESTATAIRE ne peut prescrire que sur SA consultation
        if (auth != null && medicalAccessService.isPrestataire(auth)) {
            if (request.getConsultationId() == null
                    || !medicalAccessService.canWriteConsultation(auth, request.getConsultationId())) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : vous ne pouvez prescrire que sur vos propres consultations"));
            }
        }

        Prescription prescription = new Prescription();
        prescription.setMedicament(request.getMedicament());
        prescription.setDosage(request.getDosage());
        prescription.setDuree(request.getDuree());
        prescription.setInstructions(request.getInstructions());

        // Lier la consultation
        if (request.getConsultationId() != null) {
            Consultation consultation = consultationRepository.findById(request.getConsultationId())
                .orElse(null);
            prescription.setConsultation(consultation);
        }

        // Incohérence #2 fix : lier le prescripteur
        if (auth != null) {
            Optional<User> userOpt = userRepository.findByEmail(auth.getName());
            if (userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.PRESTATAIRE) {
                prestataireRepository.findFirstByEmail(auth.getName())
                    .ifPresent(prescription::setPrescripteur);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(
            PrescriptionDto.fromEntity(prescriptionService.createPrescription(prescription))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<PrescriptionDto>> updatePrescription(
            @PathVariable Long id, @RequestBody Prescription prescriptionDetails, Authentication auth) {
        // BOLA écriture : un PRESTATAIRE ne modifie que ses propres ordonnances
        if (!medicalAccessService.canWritePrescription(auth, id)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : cette ordonnance ne vous est pas modifiable"));
        }
        return ResponseEntity.ok(ApiResponse.success(
            PrescriptionDto.fromEntity(prescriptionService.updatePrescription(id, prescriptionDetails))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePrescription(@PathVariable Long id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.ok(ApiResponse.success("Prescription supprimée"));
    }
}
