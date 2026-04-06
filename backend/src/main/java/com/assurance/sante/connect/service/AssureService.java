package com.assurance.sante.connect.service;

import com.assurance.sante.connect.dto.AssureDto;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssureService {

    private final AssureRepository assureRepository;

    public List<AssureDto> getAllAssures() {
        return assureRepository.findAll().stream()
            .map(AssureDto::fromEntity)
            .collect(Collectors.toList());
    }

    public AssureDto getAssureById(Long id) {
        Assure assure = assureRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Assure not found with id: " + id));
        return AssureDto.fromEntity(assure);
    }

    public AssureDto createAssure(AssureDto assureDto) {
        if (assureDto.getNumero() == null || assureDto.getNumero().isBlank()) {
            throw new IllegalArgumentException("Le numéro d'assuré est requis");
        }

        assureRepository.findByNumero(assureDto.getNumero()).ifPresent(existing -> {
            throw new IllegalArgumentException("Un assuré avec ce numéro existe déjà");
        });

        Assure assure = Assure.builder()
            .numero(assureDto.getNumero())
            .nom(assureDto.getNom())
            .prenom(assureDto.getPrenom())
            .telephone(assureDto.getTelephone())
            .email(assureDto.getEmail())
            .statut(Assure.AssureStatut.valueOf(assureDto.getStatut() != null ? assureDto.getStatut() : "ACTIF"))
            .type(Assure.AssureType.valueOf(assureDto.getType() != null ? assureDto.getType() : "FAMILLE"))
            .adresse(assureDto.getAdresse())
            .prime(assureDto.getPrime())
            .dateDebut(assureDto.getDateDebut())
            .dateFin(assureDto.getDateFin())
            .beneficiaires(assureDto.getBeneficiaires())
            .secteur(assureDto.getSecteur())
            .employes(assureDto.getEmployes())
            .assures(assureDto.getAssures())
            .build();

        assure = assureRepository.save(assure);
        return AssureDto.fromEntity(assure);
    }

    public AssureDto updateAssure(Long id, AssureDto assureDto) {
        Assure assure = assureRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Assure not found with id: " + id));

        if (assureDto.getNom() != null) assure.setNom(assureDto.getNom());
        if (assureDto.getPrenom() != null) assure.setPrenom(assureDto.getPrenom());
        if (assureDto.getTelephone() != null) assure.setTelephone(assureDto.getTelephone());
        if (assureDto.getEmail() != null) assure.setEmail(assureDto.getEmail());
        if (assureDto.getAdresse() != null) assure.setAdresse(assureDto.getAdresse());
        if (assureDto.getPrime() != null) assure.setPrime(assureDto.getPrime());
        if (assureDto.getDateDebut() != null) assure.setDateDebut(assureDto.getDateDebut());
        if (assureDto.getDateFin() != null) assure.setDateFin(assureDto.getDateFin());
        if (assureDto.getBeneficiaires() != null) assure.setBeneficiaires(assureDto.getBeneficiaires());
        if (assureDto.getSecteur() != null) assure.setSecteur(assureDto.getSecteur());
        if (assureDto.getEmployes() != null) assure.setEmployes(assureDto.getEmployes());
        if (assureDto.getAssures() != null) assure.setAssures(assureDto.getAssures());

        assure = assureRepository.save(assure);
        return AssureDto.fromEntity(assure);
    }

    public void deleteAssure(Long id) {
        Assure assure = assureRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Assure not found with id: " + id));
        assureRepository.delete(assure);
    }
}
