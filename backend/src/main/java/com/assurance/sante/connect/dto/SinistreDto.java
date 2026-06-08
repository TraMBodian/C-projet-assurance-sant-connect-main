package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.Sinistre;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SinistreDto {
    private Long id;
    private String numero;
    private String type;
    private String description;
    private BigDecimal montantReclamation;
    private BigDecimal montantAccorde;
    private String statut;
    private LocalDateTime dateSinistre;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // Infos assuré sans données sensibles imbriquées
    private Long assureId;
    private String assureNom;
    private String assurePrenom;

    public static SinistreDto fromEntity(Sinistre s) {
        SinistreDto dto = SinistreDto.builder()
            .id(s.getId())
            .numero(s.getNumero())
            .type(s.getType())
            .description(s.getDescription())
            .montantReclamation(s.getMontantReclamation())
            .montantAccorde(s.getMontantAccorde())
            .statut(s.getStatut() != null ? s.getStatut().name() : null)
            .dateSinistre(s.getDateSinistre())
            .createdAt(s.getCreatedAt())
            .updatedAt(s.getUpdatedAt())
            .build();
        if (s.getAssure() != null) {
            dto.setAssureId(s.getAssure().getId());
            dto.setAssureNom(s.getAssure().getNom());
            dto.setAssurePrenom(s.getAssure().getPrenom());
        }
        return dto;
    }
}
