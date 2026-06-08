package com.assurance.sante.connect.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FournirLignePrestationRequest {

    @NotNull
    private Long prestataireId;

    private Long prescriptionId;
}
