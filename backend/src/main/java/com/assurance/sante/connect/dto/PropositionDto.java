package com.assurance.sante.connect.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PropositionDto {

    private String id;
    private TypeProposition type;
    private StatutProposition statut;
    private String reference;
    private String createdAt;
    private String updatedAt;
    private String envoyeeAt;
    private String accepteeAt;
    private String policeId;
    private PropositionFamilleData famille;
    private PropositionGroupeData groupe;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PropositionFamilleData {
        private String souscripteurNom;
        private String souscripteurEmail;
        private String souscripteurTel;
        private String souscripteurAdresse;
        private List<MembreFamille> membresFamille;
        private Integer nbAdultes;
        private Integer nbEnfants;
        private Integer nbPersonnesAgees;
        private String typeGarantie;
        private Integer dureeAns;
        private Double primeEstimee;
        private Double tauxRemboursement;
        private Double tarifsPersoAdulte;
        private Double tarifsPersoEnfant;
        private Double tarifsPersoAdulteAge;
        private String observations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PropositionGroupeData {
        private String entreprise;
        private String secteur;
        private String contactNom;
        private String contactEmail;
        private String contactTel;
        private Integer nbAdultes;
        private Integer nbEnfants;
        private Integer nbPersonnesAgees;
        private String typeGarantie;
        private Integer dureeAns;
        private Double primeEstimee;
        private Double tauxRemboursement;
        private Double tarifsPersoAdulte;
        private Double tarifsPersoEnfant;
        private Double tarifsPersoAdulteAge;
        private String observations;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MembreFamille {
        private String role;
        private String nom;
        private String prenom;
        private String dateNaissance;
        private String relation;
    }

    public enum TypeProposition {
        FAMILLE,
        GROUPE
    }

    public enum StatutProposition {
        brouillon,
        envoyee,
        acceptee,
        refusee,
        convertie
    }
}
