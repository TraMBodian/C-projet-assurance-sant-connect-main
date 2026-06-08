package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Relation explicite patient (Assure) ↔ prestataire.
 *
 * C'est la SEULE source de vérité pour décider si un prestataire peut accéder
 * aux données d'un patient. Un prestataire ne peut JAMAIS passer une assignation
 * à ACTIVE lui-même :
 *  - ADMIN_GRANT      : créée ACTIVE par un administrateur.
 *  - PATIENT_CONSENT  : demandée PENDING par le prestataire, activée par le PATIENT.
 */
@Entity
@Table(name = "patient_provider_assignment",
    uniqueConstraints = @UniqueConstraint(name = "uq_ppa", columnNames = {"assure_id", "prestataire_id"}),
    indexes = {
        @Index(name = "idx_ppa_prestataire", columnList = "prestataire_id, status"),
        @Index(name = "idx_ppa_assure",      columnList = "assure_id, status")
    })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientProviderAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "assure_id", nullable = false)
    private Assure assure;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "prestataire_id", nullable = false)
    private Prestataire prestataire;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentSource source;

    @Column(name = "granted_by_email")
    private String grantedByEmail;

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_to")
    private LocalDateTime validTo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AssignmentStatus { PENDING, ACTIVE, REVOKED, EXPIRED }
    public enum AssignmentSource { ADMIN_GRANT, PATIENT_CONSENT }
}
