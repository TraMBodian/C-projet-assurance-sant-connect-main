package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.Prestation;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrestationDto {

    private Long id;
    private String type;
    private String statut;
    private Long ordonnanceId;
    private String ordonnanceReference;
    private LocalDateTime dateExecution;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private AssureRef assure;
    private PrestataireRef prestataireDemandeur;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssureRef {
        private Long id;
        private String nom;
        private String prenom;
        private String numero;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrestataireRef {
        private Long id;
        private String nom;
        private String type;
    }

    public static PrestationDto fromEntity(Prestation p) {
        PrestationDto dto = new PrestationDto();
        dto.setId(p.getId());
        dto.setType(p.getType() != null ? p.getType().name() : null);
        dto.setStatut(p.getStatut() != null ? p.getStatut().name() : null);
        dto.setOrdonnanceId(p.getOrdonnanceId());
        dto.setOrdonnanceReference(p.getOrdonnanceReference());
        dto.setDateExecution(p.getDateExecution());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());

        if (p.getAssure() != null) {
            dto.setAssure(new AssureRef(
                p.getAssure().getId(),
                p.getAssure().getNom(),
                p.getAssure().getPrenom(),
                p.getAssure().getNumero(),
                p.getAssure().getEmail()
            ));
        }

        if (p.getPrestataireDemandeur() != null) {
            dto.setPrestataireDemandeur(new PrestataireRef(
                p.getPrestataireDemandeur().getId(),
                p.getPrestataireDemandeur().getNom(),
                p.getPrestataireDemandeur().getType() != null
                    ? p.getPrestataireDemandeur().getType().name() : null
            ));
        }

        return dto;
    }
}
