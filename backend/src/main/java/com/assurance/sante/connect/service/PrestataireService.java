package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrestataireService {

    private final PrestataireRepository prestataireRepository;

    public List<Prestataire> getAllPrestataires() {
        return prestataireRepository.findAll();
    }

    public Prestataire getPrestataireById(Long id) {
        return prestataireRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found with id: " + id));
    }

    public Prestataire createPrestataire(Prestataire prestataire) {
        return prestataireRepository.save(prestataire);
    }

    public Prestataire updatePrestataire(Long id, Prestataire prestataireDetails) {
        Prestataire prestataire = prestataireRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found with id: " + id));

        if (prestataireDetails.getNom() != null) prestataire.setNom(prestataireDetails.getNom());
        if (prestataireDetails.getType() != null) prestataire.setType(prestataireDetails.getType());
        if (prestataireDetails.getTelephone() != null) prestataire.setTelephone(prestataireDetails.getTelephone());
        if (prestataireDetails.getEmail() != null) prestataire.setEmail(prestataireDetails.getEmail());
        if (prestataireDetails.getAdresse() != null) prestataire.setAdresse(prestataireDetails.getAdresse());
        if (prestataireDetails.getStatut() != null) prestataire.setStatut(prestataireDetails.getStatut());

        return prestataireRepository.save(prestataire);
    }

    public void deletePrestataire(Long id) {
        Prestataire prestataire = prestataireRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found with id: " + id));
        prestataireRepository.delete(prestataire);
    }
}
