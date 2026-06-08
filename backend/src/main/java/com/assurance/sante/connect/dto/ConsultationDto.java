package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.Consultation;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO de consultation : évite de sérialiser directement l'entité JPA (risque de cycles,
 * open-in-view, surcharge de données). Structure identique à ce qu'attend le frontend.
 */
@Data
@Builder
public class ConsultationDto {

    private Long id;
    private String statut;
    private String motif;
    private String diagnostic;
    private LocalDateTime dateConsultation;
    private String motifAnnulation;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private AssureInfo assure;
    private PrestataireInfo prestataire;

    @Data @Builder
    public static class AssureInfo {
        private Long id;
        private String nom;
        private String prenom;
        private String numero;
        private String email;
    }

    @Data @Builder
    public static class PrestataireInfo {
        private Long id;
        private String nom;
        private String type;
        private String email;
        private String statut;
    }

    public static ConsultationDto fromEntity(Consultation c) {
        AssureInfo assureInfo = null;
        if (c.getAssure() != null) {
            assureInfo = AssureInfo.builder()
                .id(c.getAssure().getId())
                .nom(c.getAssure().getNom())
                .prenom(c.getAssure().getPrenom())
                .numero(c.getAssure().getNumero())
                .email(c.getAssure().getEmail())
                .build();
        }

        PrestataireInfo prestInfo = null;
        if (c.getPrestataire() != null) {
            prestInfo = PrestataireInfo.builder()
                .id(c.getPrestataire().getId())
                .nom(c.getPrestataire().getNom())
                .type(c.getPrestataire().getType() != null ? c.getPrestataire().getType().name() : null)
                .email(c.getPrestataire().getEmail())
                .statut(c.getPrestataire().getStatut() != null ? c.getPrestataire().getStatut().name() : null)
                .build();
        }

        return ConsultationDto.builder()
            .id(c.getId())
            .statut(c.getStatut() != null ? c.getStatut().name() : null)
            .motif(c.getMotif())
            .diagnostic(c.getDiagnostic())
            .dateConsultation(c.getDateConsultation())
            .motifAnnulation(c.getMotifAnnulation())
            .createdAt(c.getCreatedAt())
            .updatedAt(c.getUpdatedAt())
            .assure(assureInfo)
            .prestataire(prestInfo)
            .build();
    }
}
