package com.assurance.sante.connect.config;

import com.assurance.sante.connect.entity.Consultation;
import com.assurance.sante.connect.entity.PatientProviderAssignment;
import com.assurance.sante.connect.entity.PatientProviderAssignment.AssignmentSource;
import com.assurance.sante.connect.entity.PatientProviderAssignment.AssignmentStatus;
import com.assurance.sante.connect.repository.ConsultationRepository;
import com.assurance.sante.connect.repository.PatientProviderAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Backfill des assignations patient ↔ prestataire (R2), exécuté au démarrage.
 *
 * IDEMPOTENT : ne s'exécute QUE si la table est vide. Dérive une assignation
 * ACTIVE pour chaque couple (patient, prestataire) ayant au moins une consultation
 * historique — afin de NE PAS couper l'accès des prestataires déjà en place lors
 * du passage au modèle d'ownership réel.
 *
 * Compatible tous profils : en prod (Flyway) comme en dev (H2/ddl-auto).
 * En prod, si un backfill SQL a déjà peuplé la table, ce runner ne fait rien.
 */
@Component
@Order(20)
@RequiredArgsConstructor
@Slf4j
public class AssignmentBackfillRunner implements ApplicationRunner {

    private final PatientProviderAssignmentRepository assignmentRepository;
    private final ConsultationRepository consultationRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (assignmentRepository.count() > 0) {
            return; // déjà peuplé → ne rien faire
        }

        Set<String> seen = new HashSet<>();
        int created = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Consultation c : consultationRepository.findAll()) {
            if (c.getAssure() == null || c.getPrestataire() == null) continue;
            Long assureId = c.getAssure().getId();
            Long prestId  = c.getPrestataire().getId();
            String key = assureId + "#" + prestId;
            if (!seen.add(key)) continue;

            PatientProviderAssignment a = PatientProviderAssignment.builder()
                .assure(c.getAssure())
                .prestataire(c.getPrestataire())
                .status(AssignmentStatus.ACTIVE)
                .source(AssignmentSource.ADMIN_GRANT)
                .grantedByEmail("system-backfill")
                .validFrom(now)
                .createdAt(now)
                .updatedAt(now)
                .build();
            assignmentRepository.save(a);
            created++;
        }

        if (created > 0) {
            log.info("Backfill assignations patient↔prestataire : {} relation(s) ACTIVE créée(s) depuis l'historique.", created);
        }
    }
}
