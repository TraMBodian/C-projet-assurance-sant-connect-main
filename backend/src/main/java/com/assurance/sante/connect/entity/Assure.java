package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assures")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    private String telephone;

    private String email;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AssureStatut statut = AssureStatut.ACTIF;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AssureType type = AssureType.FAMILLE;

    private String adresse;

    private String prime;
    private String dateDebut;
    private String dateFin;

    @ElementCollection
    @CollectionTable(name = "assure_beneficiaires", joinColumns = @JoinColumn(name = "assure_id"))
    @Column(name = "beneficiaire")
    private java.util.List<String> beneficiaires;

    private String secteur;
    private Integer employes;
    private Integer assures;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum AssureStatut {
        ACTIF,
        SUSPENDU,
        RESILIE
    }

    public enum AssureType {
        FAMILLE,
        GROUPE
    }
}
