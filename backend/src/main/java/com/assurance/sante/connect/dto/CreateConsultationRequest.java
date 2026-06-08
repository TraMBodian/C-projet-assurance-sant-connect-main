package com.assurance.sante.connect.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateConsultationRequest {

    @NotNull(message = "L'assuré est requis")
    private Long assureId;

    @NotNull(message = "Le prestataire est requis")
    private Long prestataireId;

    private String motif;

    private String diagnostic;

    private LocalDateTime dateConsultation;

    private String statut;

    private String motifAnnulation;
}
