package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.Consultation;
import com.assurance.sante.connect.entity.DocumentMedical;
import com.assurance.sante.connect.entity.Prescription;
import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.entity.Sinistre;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.ConsultationRepository;
import com.assurance.sante.connect.repository.DocumentMedicalRepository;
import com.assurance.sante.connect.repository.PrescriptionRepository;
import com.assurance.sante.connect.entity.PatientProviderAssignment.AssignmentStatus;
import com.assurance.sante.connect.repository.PatientProviderAssignmentRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.SinistreRepository;
import com.assurance.sante.connect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service centralisé d'autorisation d'accès aux données médicales (BOLA / IDOR).
 *
 * Règles d'isolation appliquées :
 *  - ADMIN        : accès complet.
 *  - CLIENT       : uniquement son propre dossier (assuré rattaché à son email).
 *  - PRESTATAIRE  : uniquement les patients qui lui sont RÉELLEMENT associés,
 *                   c'est-à-dire ceux pour lesquels il existe au moins une
 *                   consultation entre ce prestataire et l'assuré.
 *
 * Tous les contrôleurs manipulant des données médicales (consultations,
 * ordonnances, sinistres, documents) doivent passer par ce service plutôt que
 * de réimplémenter des contrôles locaux partiels.
 */
@Service
@RequiredArgsConstructor
public class MedicalAccessService {

    private final UserRepository           userRepository;
    private final AssureRepository         assureRepository;
    private final PrestataireRepository    prestataireRepository;
    private final ConsultationRepository   consultationRepository;
    private final PrescriptionRepository   prescriptionRepository;
    private final SinistreRepository       sinistreRepository;
    private final DocumentMedicalRepository documentRepository;
    private final PatientProviderAssignmentRepository assignmentRepository;

    // ── Helpers de rôle ────────────────────────────────────────────────────────

    private Optional<User> currentUser(Authentication auth) {
        if (auth == null || auth.getName() == null) return Optional.empty();
        return userRepository.findByEmail(auth.getName());
    }

    public boolean isAdmin(Authentication auth) {
        return currentUser(auth).map(u -> u.getRole() == User.UserRole.ADMIN).orElse(false);
    }

    public boolean isPrestataire(Authentication auth) {
        return currentUser(auth).map(u -> u.getRole() == User.UserRole.PRESTATAIRE).orElse(false);
    }

    public boolean isClient(Authentication auth) {
        return currentUser(auth).map(u -> u.getRole() == User.UserRole.CLIENT).orElse(false);
    }

    /** Id de l'assuré rattaché au compte connecté (CLIENT), ou null. */
    public Long currentAssureId(Authentication auth) {
        if (auth == null) return null;
        return assureRepository.findByEmail(auth.getName()).map(Assure::getId).orElse(null);
    }

    /** Id du prestataire rattaché au compte connecté (PRESTATAIRE), ou null. */
    public Long currentPrestataireId(Authentication auth) {
        if (auth == null) return null;
        return prestataireRepository.findFirstByEmail(auth.getName()).map(Prestataire::getId).orElse(null);
    }

    // ── Accès patient (assuré) ───────────────────────────────────────────────────

    public boolean canAccessPatient(Authentication auth, Long patientId) {
        if (patientId == null) return false;
        if (isAdmin(auth)) return true;

        if (isClient(auth)) {
            Long myAssureId = currentAssureId(auth);
            return myAssureId != null && myAssureId.equals(patientId);
        }

        if (isPrestataire(auth)) {
            Long prestId = currentPrestataireId(auth);
            if (prestId == null) return false;
            // Ownership RÉEL : une assignation ACTIVE doit exister (créée par un ADMIN
            // ou validée par le patient). Une consultation auto-créée ne suffit plus.
            return assignmentRepository
                .existsByPrestataireIdAndAssureIdAndStatus(prestId, patientId, AssignmentStatus.ACTIVE);
        }
        return false;
    }

    /** Vrai si une assignation ACTIVE lie le prestataire connecté à ce patient. */
    public boolean hasActiveAssignment(Authentication auth, Long patientId) {
        Long prestId = currentPrestataireId(auth);
        return prestId != null && patientId != null
            && assignmentRepository.existsByPrestataireIdAndAssureIdAndStatus(prestId, patientId, AssignmentStatus.ACTIVE);
    }

    /** Identifiants des patients assignés (ACTIVE) au prestataire connecté. */
    public Set<Long> assignedPatientIds(Authentication auth) {
        Long prestId = currentPrestataireId(auth);
        if (prestId == null) return Set.of();
        return assignmentRepository.findByPrestataireIdAndStatus(prestId, AssignmentStatus.ACTIVE).stream()
            .filter(a -> a.getAssure() != null)
            .map(a -> a.getAssure().getId())
            .collect(Collectors.toSet());
    }

    // ── Accès consultation ───────────────────────────────────────────────────────

    public boolean canAccessConsultation(Authentication auth, Long consultationId) {
        if (consultationId == null) return false;
        return consultationRepository.findById(consultationId)
            .map(c -> canAccessConsultation(auth, c))
            .orElse(false);
    }

    public boolean canAccessConsultation(Authentication auth, Consultation consultation) {
        if (consultation == null) return false;
        if (isAdmin(auth)) return true;

        if (isClient(auth)) {
            Long myAssureId = currentAssureId(auth);
            return myAssureId != null && consultation.getAssure() != null
                && myAssureId.equals(consultation.getAssure().getId());
        }

        if (isPrestataire(auth)) {
            Long prestId = currentPrestataireId(auth);
            return prestId != null && consultation.getPrestataire() != null
                && prestId.equals(consultation.getPrestataire().getId());
        }
        return false;
    }

    // ── Accès ordonnance ───────────────────────────────────────────────────────

    public boolean canAccessPrescription(Authentication auth, Long prescriptionId) {
        if (prescriptionId == null) return false;
        return prescriptionRepository.findById(prescriptionId)
            .map(p -> canAccessPrescription(auth, p))
            .orElse(false);
    }

    public boolean canAccessPrescription(Authentication auth, Prescription prescription) {
        if (prescription == null) return false;
        if (isAdmin(auth)) return true;

        // Le prescripteur a toujours accès à ses propres ordonnances
        if (isPrestataire(auth)) {
            Long prestId = currentPrestataireId(auth);
            if (prestId != null && prescription.getPrescripteur() != null
                    && prestId.equals(prescription.getPrescripteur().getId())) {
                return true;
            }
        }
        // Sinon, accès dérivé de la consultation associée
        return canAccessConsultation(auth, prescription.getConsultation());
    }

    // ── Accès sinistre ───────────────────────────────────────────────────────────

    public boolean canAccessSinistre(Authentication auth, Long sinistreId) {
        if (sinistreId == null) return false;
        return sinistreRepository.findById(sinistreId)
            .map(s -> canAccessSinistre(auth, s))
            .orElse(false);
    }

    public boolean canAccessSinistre(Authentication auth, Sinistre sinistre) {
        if (sinistre == null) return false;
        if (isAdmin(auth)) return true;
        if (sinistre.getAssure() == null) return false;
        return canAccessPatient(auth, sinistre.getAssure().getId());
    }

    // ── Accès document médical ────────────────────────────────────────────────────

    public boolean canAccessDocument(Authentication auth, Long documentId) {
        if (documentId == null) return false;
        return documentRepository.findById(documentId)
            .map(d -> canAccessDocument(auth, d))
            .orElse(false);
    }

    public boolean canAccessDocument(Authentication auth, DocumentMedical doc) {
        if (doc == null) return false;
        if (isAdmin(auth)) return true;
        // Accès via la consultation liée si présente, sinon via l'assuré propriétaire
        if (doc.getConsultation() != null) {
            return canAccessConsultation(auth, doc.getConsultation());
        }
        if (doc.getAssure() != null) {
            return canAccessPatient(auth, doc.getAssure().getId());
        }
        return false;
    }

    // ════════════════════════════════════════════════════════════════════════════
    //  Autorisations d'ÉCRITURE (PUT/PATCH/DELETE) — plus strictes que la lecture.
    //  Un PRESTATAIRE ne peut modifier QUE ses propres ressources (celles dont il
    //  est le prestataire/prescripteur), jamais celles d'un autre prestataire.
    //  Un CLIENT ne modifie aucune ressource médicale par ces voies.
    // ════════════════════════════════════════════════════════════════════════════

    public boolean canWriteConsultation(Authentication auth, Long consultationId) {
        if (consultationId == null) return false;
        return consultationRepository.findById(consultationId)
            .map(c -> canWriteConsultation(auth, c))
            .orElse(false);
    }

    public boolean canWriteConsultation(Authentication auth, Consultation consultation) {
        if (consultation == null) return false;
        if (isAdmin(auth)) return true;
        if (isPrestataire(auth)) {
            Long prestId = currentPrestataireId(auth);
            return prestId != null && consultation.getPrestataire() != null
                && prestId.equals(consultation.getPrestataire().getId());
        }
        return false;
    }

    public boolean canWritePrescription(Authentication auth, Long prescriptionId) {
        if (prescriptionId == null) return false;
        return prescriptionRepository.findById(prescriptionId)
            .map(p -> canWritePrescription(auth, p))
            .orElse(false);
    }

    public boolean canWritePrescription(Authentication auth, Prescription prescription) {
        if (prescription == null) return false;
        if (isAdmin(auth)) return true;
        if (isPrestataire(auth)) {
            Long prestId = currentPrestataireId(auth);
            if (prestId == null) return false;
            // Prescripteur de l'ordonnance
            if (prescription.getPrescripteur() != null
                    && prestId.equals(prescription.getPrescripteur().getId())) {
                return true;
            }
            // Ou prestataire de la consultation liée
            return prescription.getConsultation() != null
                && prescription.getConsultation().getPrestataire() != null
                && prestId.equals(prescription.getConsultation().getPrestataire().getId());
        }
        return false;
    }

    /**
     * Écriture sur le dossier d'un patient (sinistre, document…). Réservé à l'ADMIN :
     * les prestataires ne modifient pas directement le dossier d'un assuré.
     */
    public boolean canWritePatient(Authentication auth, Long patientId) {
        return isAdmin(auth);
    }
}
