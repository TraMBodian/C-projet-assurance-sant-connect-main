package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prestations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prestation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypePrestation type;

    @ManyToOne
    @JoinColumn(name = "assure_id", nullable = false)
    private Assure assure;

    @Column(name = "ordonnance_id")
    private Long ordonnanceId;

    @Column(name = "ordonnance_reference")
    private String ordonnanceReference;

    @ManyToOne
    @JoinColumn(name = "prestataire_demandeur_id")
    private Prestataire prestataireDemandeur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPrestation statut = StatutPrestation.EN_ATTENTE;

    @Column(name = "date_execution")
    private LocalDateTime dateExecution;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum TypePrestation {
        MEDICAMENT,
        CONSULTATION,
        ANALYSE,
        HOSPITALISATION,
        CHIRURGIE,
        AUTRE
    }

    public enum StatutPrestation {
        EN_ATTENTE,
        EN_COURS,
        FOURNIE,
        ANNULEE,
        REFUSEE
    }
}
