package com.assurance.sante.connect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreatePrescriptionRequest {

    @NotNull(message = "La consultation est requise")
    private Long consultationId;

    @NotBlank(message = "Le médicament est requis")
    private String medicament;

    @NotBlank(message = "Le dosage est requis")
    private String dosage;

    @NotBlank(message = "La durée est requise")
    private String duree;

    private String instructions;
}
