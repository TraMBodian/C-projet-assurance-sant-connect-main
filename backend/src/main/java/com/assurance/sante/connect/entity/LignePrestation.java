package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ligne_prestation", indexes = {
    @Index(name = "idx_ligne_prestation_id", columnList = "prestation_id"),
    @Index(name = "idx_ligne_statut",        columnList = "statut"),
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LignePrestation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "prestation_id", nullable = false)
    private Prestation prestation;

    @Column(name = "produit_id")
    private Long produitId;

    @Column(name = "produit_nom")
    private String produitNom;

    @Column(nullable = false)
    private Integer quantite = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutLignePrestation statut = StatutLignePrestation.EN_ATTENTE;

    @ManyToOne
    @JoinColumn(name = "fourni_par_id")
    private Prestataire fourniPar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @Column(name = "date_fourniture")
    private LocalDateTime dateFourniture;

    @Column(name = "montant_facture")
    private java.math.BigDecimal montantFacture;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum StatutLignePrestation {
        EN_ATTENTE,
        EN_COURS,
        FOURNIE,
        ANNULEE,
        REFUSEE
    }
}
