package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.Prescription;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PrescriptionDto {

    private Long id;
    private String medicament;
    private String dosage;
    private String duree;
    private String instructions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private ConsultationInfo consultation;
    private PrescripteurInfo  prescripteur;

    @Data @Builder
    public static class ConsultationInfo {
        private Long   id;
        private String statut;
        private String dateConsultation;
        private AssureInfo  assure;
        private ProviderInfo prestataire;
    }

    @Data @Builder
    public static class AssureInfo {
        private Long   id;
        private String nom;
        private String prenom;
        private String numero;
    }

    @Data @Builder
    public static class ProviderInfo {
        private Long   id;
        private String nom;
        private String type;
    }

    @Data @Builder
    public static class PrescripteurInfo {
        private Long   id;
        private String nom;
        private String type;
    }

    public static PrescriptionDto fromEntity(Prescription p) {
        ConsultationInfo consInfo = null;
        if (p.getConsultation() != null) {
            var c = p.getConsultation();
            AssureInfo ai = c.getAssure() != null ? AssureInfo.builder()
                .id(c.getAssure().getId())
                .nom(c.getAssure().getNom())
                .prenom(c.getAssure().getPrenom())
                .numero(c.getAssure().getNumero())
                .build() : null;
            ProviderInfo pi = c.getPrestataire() != null ? ProviderInfo.builder()
                .id(c.getPrestataire().getId())
                .nom(c.getPrestataire().getNom())
                .type(c.getPrestataire().getType() != null ? c.getPrestataire().getType().name() : null)
                .build() : null;
            consInfo = ConsultationInfo.builder()
                .id(c.getId())
                .statut(c.getStatut() != null ? c.getStatut().name() : null)
                .dateConsultation(c.getDateConsultation() != null ? c.getDateConsultation().toString() : null)
                .assure(ai)
                .prestataire(pi)
                .build();
        }

        PrescripteurInfo prescInfo = null;
        if (p.getPrescripteur() != null) {
            prescInfo = PrescripteurInfo.builder()
                .id(p.getPrescripteur().getId())
                .nom(p.getPrescripteur().getNom())
                .type(p.getPrescripteur().getType() != null ? p.getPrescripteur().getType().name() : null)
                .build();
        }

        return PrescriptionDto.builder()
            .id(p.getId())
            .medicament(p.getMedicament())
            .dosage(p.getDosage())
            .duree(p.getDuree())
            .instructions(p.getInstructions())
            .createdAt(p.getCreatedAt())
            .updatedAt(p.getUpdatedAt())
            .consultation(consInfo)
            .prescripteur(prescInfo)
            .build();
    }
}
