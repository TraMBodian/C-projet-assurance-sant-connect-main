package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.Police;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoliceDto {
    private Long id;
    private String numero;
    private String type;
    private String couverture;
    private BigDecimal montantPrime;
    private String statut;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private LocalDateTime createdAt;
    // Infos assuré en clair — sans données sensibles imbriquées complètes
    private Long assureId;
    private String assureNom;
    private String assurePrenom;
    private String assureNumero;

    public static PoliceDto fromEntity(Police p) {
        PoliceDto dto = PoliceDto.builder()
            .id(p.getId())
            .numero(p.getNumero())
            .type(p.getType())
            .couverture(p.getCouverture())
            .montantPrime(p.getMontantPrime())
            .statut(p.getStatut() != null ? p.getStatut().name() : null)
            .dateDebut(p.getDateDebut())
            .dateFin(p.getDateFin())
            .createdAt(p.getCreatedAt())
            .build();
        if (p.getAssure() != null) {
            dto.setAssureId(p.getAssure().getId());
            dto.setAssureNom(p.getAssure().getNom());
            dto.setAssurePrenom(p.getAssure().getPrenom());
            dto.setAssureNumero(p.getAssure().getNumero());
        }
        return dto;
    }
}
