package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.Prestataire;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO de prestataire : évite d'exposer directement l'entité JPA (relation {@code user},
 * proxys lazy, surface de données interne). N'expose que les champs métier nécessaires.
 */
@Data
@Builder
public class PrestataireDto {
    private Long id;
    private String numero;
    private String nom;
    private String type;
    private String telephone;
    private String email;
    private String adresse;
    private String statut;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PrestataireDto fromEntity(Prestataire p) {
        if (p == null) return null;
        return PrestataireDto.builder()
            .id(p.getId())
            .numero(p.getNumero())
            .nom(p.getNom())
            .type(p.getType() != null ? p.getType().name() : null)
            .telephone(p.getTelephone())
            .email(p.getEmail())
            .adresse(p.getAdresse())
            .statut(p.getStatut() != null ? p.getStatut().name() : null)
            .createdAt(p.getCreatedAt())
            .updatedAt(p.getUpdatedAt())
            .build();
    }
}
