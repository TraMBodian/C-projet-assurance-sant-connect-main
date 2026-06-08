package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultations", indexes = {
    @Index(name = "idx_consultation_assure_id",     columnList = "assure_id"),
    @Index(name = "idx_consultation_prestataire_id", columnList = "prestataire_id"),
    @Index(name = "idx_consultation_statut",         columnList = "statut"),
    @Index(name = "idx_consultation_date",           columnList = "date_consultation"),
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consultation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "assure_id", nullable = false)
    private Assure assure;

    @ManyToOne
    @JoinColumn(name = "prestataire_id", nullable = false)
    private Prestataire prestataire;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Column(columnDefinition = "TEXT")
    private String diagnostic;

    @Column(name = "date_consultation")
    private LocalDateTime dateConsultation;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ConsultationStatut statut = ConsultationStatut.PROGRAMMEE;

    @Column(name = "motif_annulation", columnDefinition = "TEXT")
    private String motifAnnulation;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum ConsultationStatut {
        PROGRAMMEE,
        COMPLETEE,
        ANNULEE
    }
}
