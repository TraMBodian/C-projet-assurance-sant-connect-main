package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tarifs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tarif {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Primes (FCFA)
    @Column(nullable = false)
    private Double primeEnfant;

    @Column(nullable = false)
    private Double primeAdulte;

    @Column(nullable = false)
    private Double primeAdulteAge;

    // Taux (%)
    @Column(nullable = false)
    private Double tauxTaxe;

    @Column(nullable = false)
    private Double tauxCP;

    @Column(nullable = false)
    private Double tauxRemboursement;

    // Plafonds (FCFA)
    @Column(nullable = false)
    private Double plafondDentaire;

    @Column(nullable = false)
    private Double plafondOptique;

    @Column(nullable = false)
    private Double plafondHospitalisationJour;

    @Column(nullable = false)
    private Double plafondOrthophonie;

    @Column(nullable = false)
    private Double plafondMaterniteSimple;

    @Column(nullable = false)
    private Double plafondMaterniteGemellaire;

    @Column(nullable = false)
    private Double plafondMaterniteChirurgical;

    @Column(nullable = false)
    private Double plafondTransport;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
