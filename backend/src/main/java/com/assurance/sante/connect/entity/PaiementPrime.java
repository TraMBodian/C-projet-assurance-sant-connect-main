package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "paiements_primes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaiementPrime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "police_id", nullable = false)
    private Police police;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assure_id", nullable = true)
    private Assure assure;

    /** Montant de la prime pour la période */
    @Column(nullable = false)
    private BigDecimal montant;

    /** Libellé de la période ex. "Janvier 2025" */
    @Column(name = "periode", nullable = false)
    private String periode;

    /** Date d'échéance (limite de paiement) */
    @Column(name = "date_echeance")
    private LocalDateTime dateEcheance;

    /** Date effective du paiement (null tant que non payé) */
    @Column(name = "date_paiement")
    private LocalDateTime datePaiement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutPaiement statut = StatutPaiement.EN_ATTENTE;

    /** Orange Money, Wave, Virement bancaire, Chèque, Espèces */
    @Column(name = "moyen_paiement")
    private String moyenPaiement;

    /** Référence de transaction fournie par l'opérateur */
    @Column(name = "reference_transaction")
    private String referenceTransaction;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum StatutPaiement {
        EN_ATTENTE,
        PAYE,
        EN_RETARD
    }
}
