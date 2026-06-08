package com.assurance.sante.connect.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSinistreRequest {

    private String numero;

    @NotBlank(message = "Type de sinistre requis")
    private String type;

    @NotNull(message = "Montant réclamé requis")
    @DecimalMin(value = "0", inclusive = false, message = "Montant réclamé doit être positif")
    private BigDecimal montantReclamation;

    private String description;

    @NotBlank(message = "Date du sinistre requise")
    private String dateSinistre;

    @NotBlank(message = "Statut du sinistre requis")
    private String statut;

    @NotNull(message = "Police requise")
    private Long policeId;

    @NotNull(message = "Assuré requis")
    private Long assureId;
}
