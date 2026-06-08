package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.PatientProviderAssignment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Vue d'une assignation patient ↔ prestataire (n'expose pas les entités JPA).
 */
@Data
@Builder
public class AssignmentDto {
    private Long id;
    private Long assureId;
    private String assureNom;
    private Long prestataireId;
    private String prestataireNom;
    private String status;
    private String source;
    private String grantedByEmail;
    private LocalDateTime createdAt;

    public static AssignmentDto fromEntity(PatientProviderAssignment a) {
        if (a == null) return null;
        return AssignmentDto.builder()
            .id(a.getId())
            .assureId(a.getAssure() != null ? a.getAssure().getId() : null)
            .assureNom(a.getAssure() != null
                ? (a.getAssure().getNom() + " " + a.getAssure().getPrenom()).trim() : null)
            .prestataireId(a.getPrestataire() != null ? a.getPrestataire().getId() : null)
            .prestataireNom(a.getPrestataire() != null ? a.getPrestataire().getNom() : null)
            .status(a.getStatus() != null ? a.getStatus().name() : null)
            .source(a.getSource() != null ? a.getSource().name() : null)
            .grantedByEmail(a.getGrantedByEmail())
            .createdAt(a.getCreatedAt())
            .build();
    }
}
