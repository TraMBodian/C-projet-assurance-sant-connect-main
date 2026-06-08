package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "sinistres")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sinistre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    @Column(name = "sinistre_type", nullable = false)
    private String type = "CONSULTATION";

    @ManyToOne
    @JoinColumn(name = "assure_id", nullable = false)
    private Assure assure;

    @ManyToOne
    @JoinColumn(name = "police_id", nullable = false)
    private Police police;

    @Column(columnDefinition = "TEXT")
    private String description;

    private BigDecimal montantReclamation;

    private BigDecimal montantAccorde;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SinistreStatut statut = SinistreStatut.EN_ATTENTE;

    @Column(name = "date_sinistre")
    private LocalDateTime dateSinistre = LocalDateTime.now();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum SinistreStatut {
        EN_ATTENTE,
        EN_COURS,
        APPROUVE,
        REJETE,
        PAYE
    }
}
