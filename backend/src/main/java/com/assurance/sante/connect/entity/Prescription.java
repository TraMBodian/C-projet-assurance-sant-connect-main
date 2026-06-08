package com.assurance.sante.connect.entity;

import com.assurance.sante.connect.entity.Prestataire;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prescriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "consultation_id", nullable = false)
    private Consultation consultation;

    /** Prestataire qui a rédigé la prescription (lien direct, évite de traverser consultation → prestataire) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescripteur_id")
    private Prestataire prescripteur;

    @Column(nullable = false)
    private String medicament;

    @Column(nullable = false)
    private String dosage;

    @Column(nullable = false)
    private String duree;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
