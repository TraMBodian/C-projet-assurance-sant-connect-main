package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "avenants_contrat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvenantContrat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Numéro auto-généré de l'avenant */
    @Column(unique = true, nullable = false)
    private String numero;

    @Column(nullable = false)
    private Long policeId;

    @Column(nullable = false)
    private String policeNumero;

    @Column(nullable = false)
    private String assureEmail;

    private String assureNom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAvenant type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutAvenant statut = StatutAvenant.EN_ATTENTE;

    /** Valeur actuelle (avant modification) */
    @Column(length = 500)
    private String ancienneValeur;

    /** Nouvelle valeur demandée */
    @Column(length = 500)
    private String nouvelleValeur;

    /** Description libre du changement demandé */
    @Column(length = 1000)
    private String description;

    /** Commentaire du gestionnaire */
    @Column(length = 1000)
    private String commentaireAdmin;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "traite_at")
    private LocalDateTime traiteAt;

    public enum TypeAvenant {
        MODIFICATION_COUVERTURE,
        AJOUT_BENEFICIAIRE,
        MODIFICATION_ADRESSE,
        MODIFICATION_PRIME,
        PROLONGATION,
        AUTRE
    }

    public enum StatutAvenant {
        EN_ATTENTE,
        APPROUVE,
        REFUSE,
        APPLIQUE
    }
}
