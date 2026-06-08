package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "polices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Police {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    @ManyToOne
    @JoinColumn(name = "assure_id", nullable = true)
    private Assure assure;

    @Column(nullable = false)
    private String type;

    private BigDecimal montantPrime;

    private String couverture;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PoliceStatut statut = PoliceStatut.ACTIVE;

    @Column(name = "date_debut")
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum PoliceStatut {
        ACTIVE,
        INACTIVE,
        SUSPENDUE,
        RESILIEE
    }
}
