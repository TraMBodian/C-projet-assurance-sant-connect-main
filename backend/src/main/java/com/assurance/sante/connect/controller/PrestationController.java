package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.FournirLignePrestationRequest;
import com.assurance.sante.connect.dto.PrestationDto;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.LignePrestation;
import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.entity.Prestation;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.entity.Prescription;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.PrescriptionRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.PrestationRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.PrestationService;
import com.assurance.sante.connect.service.RealtimeNotificationService;
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
@RequestMapping("/api/prestations")
@RequiredArgsConstructor
public class PrestationController {

    private final PrestationService prestationService;
    private final UserRepository userRepository;
    private final AssureRepository assureRepository;
    private final PrestataireRepository prestataireRepository;
    private final PrestationRepository prestationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final RealtimeNotificationService realtimeNotificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPrestations(Authentication auth) {
        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User.UserRole role = userOpt.get().getRole();

            if (role == User.UserRole.CLIENT) {
                Optional<Assure> assureOpt = assureRepository.findByEmail(email);
                if (assureOpt.isEmpty()) {
                    return ResponseEntity.ok(ApiResponse.success(Map.of("prestations", List.of())));
                }
                List<PrestationDto> prestations = prestationRepository.findByAssureId(assureOpt.get().getId())
                        .stream().map(PrestationDto::fromEntity).collect(Collectors.toList());
                return ResponseEntity.ok(ApiResponse.success(Map.of("prestations", prestations)));
            }

            if (role == User.UserRole.PRESTATAIRE) {
                Optional<Prestataire> prestOpt = prestataireRepository.findFirstByEmail(email);
                if (prestOpt.isEmpty()) {
                    return ResponseEntity.ok(ApiResponse.success(Map.of("prestations", List.of())));
                }
                List<Prestation.TypePrestation> allowedTypes = getAllowedTypesForPrestataire(prestOpt.get().getType());
                List<PrestationDto> prestations = prestationRepository.findByTypeIn(allowedTypes)
                        .stream().map(PrestationDto::fromEntity).collect(Collectors.toList());
                return ResponseEntity.ok(ApiResponse.success(Map.of("prestations", prestations)));
            }
        }

        // ADMIN : toutes les prestations
        List<PrestationDto> prestations = prestationService.getAllPrestations();
        return ResponseEntity.ok(ApiResponse.success(Map.of("prestations", prestations)));
    }

    private List<Prestation.TypePrestation> getAllowedTypesForPrestataire(Prestataire.TypePrestataire type) {
        return switch (type) {
            case PHARMACIE       -> List.of(Prestation.TypePrestation.MEDICAMENT);
            case HOPITAL         -> List.of(Prestation.TypePrestation.HOSPITALISATION, Prestation.TypePrestation.CHIRURGIE);
            case CLINIQUE        -> List.of(Prestation.TypePrestation.CONSULTATION);
            case LABORATOIRE     -> List.of(Prestation.TypePrestation.ANALYSE);
            case CABINET_MEDICAL -> List.of(Prestation.TypePrestation.CONSULTATION, Prestation.TypePrestation.AUTRE);
            default              -> List.of(Prestation.TypePrestation.values());
        };
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PrestationDto>> getPrestationById(@PathVariable Long id, Authentication auth) {
        if (auth != null && isClient(auth)) {
            Assure myAssure = assureRepository.findByEmail(auth.getName()).orElse(null);
            Prestation prestation = prestationRepository.findById(id).orElse(null);
            if (myAssure == null || prestation == null || prestation.getAssure() == null
                    || !myAssure.getId().equals(prestation.getAssure().getId())) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : cette prestation ne vous appartient pas"));
            }
        }
        return ResponseEntity.ok(ApiResponse.success(prestationService.getPrestationById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<Prestation>> createPrestation(@RequestBody Prestation prestation, Authentication auth) {
        // Incohérence #3 fix : auto-affecter le prestataireDemandeur quand c'est un PRESTATAIRE qui crée
        if (auth != null && prestation.getPrestataireDemandeur() == null) {
            Optional<User> userOpt = userRepository.findByEmail(auth.getName());
            if (userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.PRESTATAIRE) {
                prestataireRepository.findFirstByEmail(auth.getName())
                    .ifPresent(prestation::setPrestataireDemandeur);
            }
        }
        Prestation created = prestationService.createPrestation(prestation);

        // Notifier les prestataires du bon type qu'une nouvelle prestation est disponible
        if (created.getType() != null) {
            Prestataire.TypePrestataire targetType = mapPrestationTypeToPrestataire(created.getType());
            if (targetType != null) {
                realtimeNotificationService.notifyPrestatairesOfType(
                    targetType,
                    "nouvelle_prestation",
                    "Nouvelle prestation " + created.getType().name().toLowerCase() + " disponible",
                    "/prestations"
                );
            }
        }

        return ResponseEntity.ok(ApiResponse.success(created));
    }

    private Prestataire.TypePrestataire mapPrestationTypeToPrestataire(Prestation.TypePrestation type) {
        return switch (type) {
            case MEDICAMENT      -> Prestataire.TypePrestataire.PHARMACIE;
            case HOSPITALISATION,
                 CHIRURGIE       -> Prestataire.TypePrestataire.HOPITAL;
            case CONSULTATION    -> Prestataire.TypePrestataire.CLINIQUE;
            case ANALYSE         -> Prestataire.TypePrestataire.LABORATOIRE;
            default              -> null;
        };
    }

    @GetMapping("/{prestationId}/lignes")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLignes(@PathVariable Long prestationId, Authentication auth) {
        if (auth != null && isClient(auth)) {
            Assure myAssure = assureRepository.findByEmail(auth.getName()).orElse(null);
            Prestation prestation = prestationRepository.findById(prestationId).orElse(null);
            if (myAssure == null || prestation == null || prestation.getAssure() == null
                    || !myAssure.getId().equals(prestation.getAssure().getId())) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : ces lignes ne vous appartiennent pas"));
            }
        }
        List<LignePrestation> lignes = prestationService.getLignesByPrestation(prestationId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("lignes", lignes)));
    }

    @PostMapping("/{prestationId}/lignes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<LignePrestation>> createLigne(@PathVariable Long prestationId,
                                                                     @RequestBody LignePrestation lignePrestation) {
        return ResponseEntity.ok(ApiResponse.success(
                prestationService.createLignePrestation(prestationId, lignePrestation)));
    }

    /**
     * Marquer une ligne comme fournie.
     * - Prestataire : son ID est résolu depuis la DB (body ignoré).
     * - Admin : peut spécifier n'importe quel prestataireId dans le body.
     */
    @PostMapping("/lignes/{ligneId}/fournir")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<LignePrestation>> fournirLigne(
            @PathVariable Long ligneId,
            @RequestBody(required = false) FournirLignePrestationRequest request,
            Authentication auth) {

        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        Long prestataireId;

        if (userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.PRESTATAIRE) {
            Optional<Prestataire> prestOpt = prestataireRepository.findFirstByEmail(email);
            if (prestOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Votre compte n'est lié à aucun prestataire"));
            }
            prestataireId = prestOpt.get().getId();
        } else {
            if (request == null || request.getPrestataireId() == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("prestataireId requis pour les administrateurs"));
            }
            prestataireId = request.getPrestataireId();
        }

        Long prescriptionId = (request != null) ? request.getPrescriptionId() : null;
        LignePrestation ligne = prestationService.fournirLignePrestation(ligneId, prestataireId, prescriptionId);

        // Notifications ordonnance délivrée
        if (prescriptionId != null) {
            prescriptionRepository.findById(prescriptionId).ifPresent(prescription -> {
                String pharmacieNom = ligne.getFourniPar() != null ? ligne.getFourniPar().getNom() : "une pharmacie";
                String medicament   = prescription.getMedicament();
                String medecinNom   = prescription.getPrescripteur() != null
                        ? prescription.getPrescripteur().getNom() : "le médecin";
                String assureNom    = prescription.getConsultation() != null
                        && prescription.getConsultation().getAssure() != null
                        ? prescription.getConsultation().getAssure().getNom() + " "
                          + prescription.getConsultation().getAssure().getPrenom()
                        : "l'assuré";

                String msgAdmin     = medicament + " délivré par " + pharmacieNom
                        + " (prescrit par " + medecinNom + ") pour " + assureNom;
                String msgAssure    = "Votre médicament \"" + medicament + "\" a été délivré par " + pharmacieNom;
                String msgMedecin   = "L'ordonnance de " + assureNom + " (" + medicament
                        + ") a été prise en charge par " + pharmacieNom;

                // Notifier tous les admins
                realtimeNotificationService.notifyAdmins("ordonnance_delivree", msgAdmin, "/prestations");

                // Notifier l'assuré (CLIENT)
                if (prescription.getConsultation() != null
                        && prescription.getConsultation().getAssure() != null) {
                    String assureEmail = prescription.getConsultation().getAssure().getEmail();
                    if (assureEmail != null) {
                        userRepository.findByEmail(assureEmail).ifPresent(u ->
                            realtimeNotificationService.notifyUser(u.getId(), "ordonnance_delivree", msgAssure, "/prescriptions", "high")
                        );
                    }
                }

                // Notifier le médecin prescripteur
                if (prescription.getPrescripteur() != null && prescription.getPrescripteur().getUser() != null) {
                    realtimeNotificationService.notifyUser(
                            prescription.getPrescripteur().getUser().getId(),
                            "ordonnance_delivree", msgMedecin, "/prescriptions", "medium");
                }
            });
        }

        return ResponseEntity.ok(ApiResponse.success(ligne));
    }

    // ── Helpers privés ──────────────────────────────────────────────────────────

    private boolean isClient(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .map(u -> u.getRole() == User.UserRole.CLIENT)
            .orElse(false);
    }

    /**
     * Refuser une ligne de prestation.
     * - Prestataire : ownership vérifié — seul un prestataire du bon type peut refuser.
     * - Admin : peut refuser n'importe quelle ligne.
     */
    @PostMapping("/lignes/{ligneId}/refuser")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<LignePrestation>> refuserLigne(
            @PathVariable Long ligneId,
            Authentication auth) {

        String email = auth.getName();
        Optional<User> userOpt = userRepository.findByEmail(email);

        Long prestataireId = null;

        if (userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.PRESTATAIRE) {
            Optional<Prestataire> prestOpt = prestataireRepository.findFirstByEmail(email);
            if (prestOpt.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Votre compte n'est lié à aucun prestataire"));
            }
            prestataireId = prestOpt.get().getId();
        }

        return ResponseEntity.ok(ApiResponse.success(
                prestationService.refuserLignePrestation(ligneId, prestataireId)));
    }
}
