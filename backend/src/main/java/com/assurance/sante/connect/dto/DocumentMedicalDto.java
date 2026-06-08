package com.assurance.sante.connect.dto;

import com.assurance.sante.connect.entity.DocumentMedical;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DocumentMedicalDto {

    private Long id;
    private String nom;
    private String contentType;
    private Long taille;
    private String description;
    private LocalDateTime createdAt;

    private Long assureId;
    private String assureNom;

    private Long consultationId;

    private Long uploadedById;
    private String uploadedByNom;

    public static DocumentMedicalDto fromEntity(DocumentMedical d) {
        return DocumentMedicalDto.builder()
            .id(d.getId())
            .nom(d.getNom())
            .contentType(d.getContentType())
            .taille(d.getTaille())
            .description(d.getDescription())
            .createdAt(d.getCreatedAt())
            .assureId(d.getAssure() != null ? d.getAssure().getId() : null)
            .assureNom(d.getAssure() != null ? d.getAssure().getNom() + " " + d.getAssure().getPrenom() : null)
            .consultationId(d.getConsultation() != null ? d.getConsultation().getId() : null)
            .uploadedById(d.getUploadedBy() != null ? d.getUploadedBy().getId() : null)
            .uploadedByNom(d.getUploadedBy() != null ? d.getUploadedBy().getEmail() : null)
            .build();
    }
}
