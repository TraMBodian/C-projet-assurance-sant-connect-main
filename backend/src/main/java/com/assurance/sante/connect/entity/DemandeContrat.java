package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_contrat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeContrat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Numéro de la police concernée */
    @Column(nullable = false)
    private String policeNumero;

    /** Id de la police concernée */
    @Column(nullable = false)
    private Long policeId;

    /** Email de l'assuré demandeur */
    @Column(nullable = false)
    private String assureEmail;

    /** Nom complet de l'assuré (dénormalisé pour faciliter l'affichage admin) */
    private String assureNom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeDemande type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDemande statut = StatutDemande.EN_ATTENTE;

    /** Motif (principalement utilisé pour les résiliations) */
    private String motif;

    /** Date de début souhaitée (renouvellement) */
    private LocalDate dateDebutSouhaitee;

    /** Durée souhaitée en années (renouvellement) */
    private Integer dureeAns;

    /** Commentaires libres du client */
    @Column(length = 1000)
    private String notes;

    /** Commentaire de l'admin lors du traitement */
    @Column(length = 1000)
    private String commentaireAdmin;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "traitee_at")
    private LocalDateTime traiteeAt;

    public enum TypeDemande {
        RENOUVELLEMENT,
        RESILIATION
    }

    public enum StatutDemande {
        EN_ATTENTE,
        APPROUVEE,
        REFUSEE
    }
}
