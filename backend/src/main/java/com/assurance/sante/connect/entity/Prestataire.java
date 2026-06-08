package com.assurance.sante.connect.entity;

import com.assurance.sante.connect.entity.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prestataires", indexes = {
    @Index(name = "idx_prestataire_email",  columnList = "email"),
    @Index(name = "idx_prestataire_statut", columnList = "statut"),
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prestataire {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypePrestataire type;

    private String telephone;

    private String email;

    /** Lien formel vers le compte utilisateur (optionnel — peut être nul pour les prestataires sans compte) */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String adresse;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutPrestataire statut = StatutPrestataire.ACTIF;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum TypePrestataire {
        HOPITAL,
        CLINIQUE,
        CABINET_MEDICAL,
        PHARMACIE,
        LABORATOIRE,
        AUTRE
    }

    public enum StatutPrestataire {
        ACTIF,
        INACTIF,
        SUSPENDU
    }
}
