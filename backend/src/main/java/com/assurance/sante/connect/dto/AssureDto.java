package com.assurance.sante.connect.dto;

import lombok.*;
import com.assurance.sante.connect.entity.Assure;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssureDto {
    private Long id;
    private String numero;
    private String nom;
    private String prenom;
    private String telephone;
    private String email;
    private String statut;
    private String type;
    private String adresse;
    private String prime;
    private String dateDebut;
    private String dateFin;
    private java.util.List<String> beneficiaires;
    private String secteur;
    private Integer employes;
    private Integer assures;

    public static AssureDto fromEntity(Assure assure) {
        return AssureDto.builder()
            .id(assure.getId())
            .numero(assure.getNumero())
            .nom(assure.getNom())
            .prenom(assure.getPrenom())
            .telephone(assure.getTelephone())
            .email(assure.getEmail())
            .statut(assure.getStatut().name())
            .type(assure.getType().name())
            .adresse(assure.getAdresse())
            .prime(assure.getPrime())
            .dateDebut(assure.getDateDebut())
            .dateFin(assure.getDateFin())
            .beneficiaires(assure.getBeneficiaires())
            .secteur(assure.getSecteur())
            .employes(assure.getEmployes())
            .assures(assure.getAssures())
            .build();
    }
}
