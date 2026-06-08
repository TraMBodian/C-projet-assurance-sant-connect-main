package com.assurance.sante.connect.service;

import com.assurance.sante.connect.dto.PrestationDto;
import com.assurance.sante.connect.entity.*;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.LignePrestationRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.PrestationRepository;
import com.assurance.sante.connect.repository.PrescriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PrestationService {

    private final PrestationRepository      prestationRepository;
    private final LignePrestationRepository lignePrestationRepository;
    private final PrestataireRepository     prestataireRepository;
    private final PrescriptionRepository    prescriptionRepository;

    // ─── Lecture ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PrestationDto> getAllPrestations() {
        return prestationRepository.findAll().stream()
                .map(PrestationDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PrestationDto getPrestationById(Long id) {
        Prestation p = prestationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prestation not found with id: " + id));
        return PrestationDto.fromEntity(p);
    }

    // ─── Création ─────────────────────────────────────────────────────────────

    public Prestation createPrestation(Prestation prestation) {
        return prestationRepository.save(prestation);
    }

    public LignePrestation createLignePrestation(Long prestationId, LignePrestation lignePrestation) {
        Prestation prestation = prestationRepository.findById(prestationId)
                .orElseThrow(() -> new ResourceNotFoundException("Prestation not found with id: " + prestationId));
        lignePrestation.setPrestation(prestation);
        return lignePrestationRepository.save(lignePrestation);
    }

    // ─── Lignes ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<LignePrestation> getLignesByPrestation(Long prestationId) {
        return lignePrestationRepository.findByPrestationId(prestationId);
    }

    // ─── Fourniture ───────────────────────────────────────────────────────────

    @Transactional
    public LignePrestation fournirLignePrestation(Long ligneId, Long prestataireId, Long prescriptionId) {
        LignePrestation ligne = lignePrestationRepository.findLockedById(ligneId)
                .orElseThrow(() -> new ResourceNotFoundException("Ligne prestation not found with id: " + ligneId));

        if (ligne.getStatut() == LignePrestation.StatutLignePrestation.FOURNIE) {
            String fournisseur = ligne.getFourniPar() != null ? ligne.getFourniPar().getNom() : "un prestataire";
            throw new IllegalStateException("La prestation est déjà fournie par " + fournisseur);
        }

        Prestataire prestataire = prestataireRepository.findById(prestataireId)
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found with id: " + prestataireId));

        if (!isAllowedPrestataireForPrestation(ligne.getPrestation().getType(), prestataire.getType())) {
            throw new IllegalStateException("Ce prestataire ne peut pas fournir ce type de prestation");
        }

        if (prescriptionId != null) {
            prescriptionRepository.findById(prescriptionId)
                    .ifPresent(ligne::setPrescription);
        }

        ligne.setStatut(LignePrestation.StatutLignePrestation.FOURNIE);
        ligne.setFourniPar(prestataire);
        ligne.setDateFourniture(LocalDateTime.now());
        ligne.setUpdatedAt(LocalDateTime.now());
        lignePrestationRepository.save(ligne);

        updatePrestationStatutIfAllDone(ligne.getPrestation().getId());

        return ligne;
    }

    @Transactional
    public LignePrestation refuserLignePrestation(Long ligneId, Long prestataireId) {
        LignePrestation ligne = lignePrestationRepository.findById(ligneId)
                .orElseThrow(() -> new ResourceNotFoundException("Ligne prestation not found with id: " + ligneId));
        if (ligne.getStatut() != LignePrestation.StatutLignePrestation.EN_ATTENTE) {
            throw new IllegalStateException("Seules les lignes EN_ATTENTE peuvent être refusées");
        }
        // Vérification ownership pour les prestataires : seul un prestataire du bon type peut refuser
        if (prestataireId != null) {
            Prestataire prestataire = prestataireRepository.findById(prestataireId)
                    .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found with id: " + prestataireId));
            if (!isAllowedPrestataireForPrestation(ligne.getPrestation().getType(), prestataire.getType())) {
                throw new IllegalStateException("Ce prestataire ne peut pas traiter ce type de prestation");
            }
        }
        ligne.setStatut(LignePrestation.StatutLignePrestation.REFUSEE);
        ligne.setUpdatedAt(LocalDateTime.now());
        return lignePrestationRepository.save(ligne);
    }

    private void updatePrestationStatutIfAllDone(Long prestationId) {
        List<LignePrestation> allLignes = lignePrestationRepository.findByPrestationId(prestationId);
        boolean allFournies = !allLignes.isEmpty() && allLignes.stream()
                .allMatch(l -> l.getStatut() == LignePrestation.StatutLignePrestation.FOURNIE);
        if (allFournies) {
            prestationRepository.findById(prestationId).ifPresent(p -> {
                p.setStatut(Prestation.StatutPrestation.FOURNIE);
                p.setUpdatedAt(LocalDateTime.now());
                prestationRepository.save(p);
            });
        }
    }

    private boolean isAllowedPrestataireForPrestation(Prestation.TypePrestation type,
                                                      Prestataire.TypePrestataire providerType) {
        return switch (providerType) {
            case PHARMACIE       -> type == Prestation.TypePrestation.MEDICAMENT;
            case HOPITAL         -> type == Prestation.TypePrestation.HOSPITALISATION
                                    || type == Prestation.TypePrestation.CHIRURGIE;
            case CLINIQUE        -> type == Prestation.TypePrestation.CONSULTATION;
            case LABORATOIRE     -> type == Prestation.TypePrestation.ANALYSE;
            case CABINET_MEDICAL -> type == Prestation.TypePrestation.CONSULTATION
                                    || type == Prestation.TypePrestation.AUTRE;
            default              -> true;
        };
    }
}
