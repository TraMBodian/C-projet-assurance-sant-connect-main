package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.LignePrestationRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.PrestationRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrestataireService {

    private final PrestataireRepository     prestataireRepository;
    private final UserRepository            userRepository;
    private final LignePrestationRepository lignePrestationRepository;
    private final PrestationRepository      prestationRepository;

    public List<Prestataire> getAllPrestataires() {
        return prestataireRepository.findAll();
    }

    public Prestataire getPrestataireById(Long id) {
        return prestataireRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found with id: " + id));
    }

    public Prestataire createPrestataire(Prestataire prestataire) {
        // Auto-lier le compte User si un email correspondant existe
        if (prestataire.getEmail() != null && prestataire.getUser() == null) {
            userRepository.findByEmail(prestataire.getEmail()).ifPresent(prestataire::setUser);
        }
        return prestataireRepository.save(prestataire);
    }

    public Prestataire updatePrestataire(Long id, Prestataire prestataireDetails) {
        Prestataire prestataire = prestataireRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found with id: " + id));

        if (prestataireDetails.getNom() != null)     prestataire.setNom(prestataireDetails.getNom());
        if (prestataireDetails.getType() != null)    prestataire.setType(prestataireDetails.getType());
        if (prestataireDetails.getTelephone() != null) prestataire.setTelephone(prestataireDetails.getTelephone());
        if (prestataireDetails.getAdresse() != null) prestataire.setAdresse(prestataireDetails.getAdresse());
        if (prestataireDetails.getStatut() != null)  prestataire.setStatut(prestataireDetails.getStatut());

        // Si l'email change, mettre à jour le lien User
        if (prestataireDetails.getEmail() != null && !prestataireDetails.getEmail().equals(prestataire.getEmail())) {
            prestataire.setEmail(prestataireDetails.getEmail());
            userRepository.findByEmail(prestataireDetails.getEmail())
                .ifPresentOrElse(prestataire::setUser, () -> prestataire.setUser(null));
        }

        prestataire.setUpdatedAt(java.time.LocalDateTime.now());
        return prestataireRepository.save(prestataire);
    }

    public void deletePrestataire(Long id) {
        Prestataire prestataire = prestataireRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found with id: " + id));

        long nbLignes     = lignePrestationRepository.countByFourniParId(id);
        long nbPrestations = prestationRepository.countByPrestataireDemandeurId(id);
        if (nbLignes > 0 || nbPrestations > 0) {
            throw new IllegalStateException(
                "Impossible de supprimer ce prestataire : il est référencé par "
                + nbLignes + " ligne(s) de prestation et "
                + nbPrestations + " prestation(s). Désactivez-le plutôt (statut INACTIF).");
        }

        prestataireRepository.delete(prestataire);
    }
}
