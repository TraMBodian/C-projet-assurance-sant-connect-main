package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.DemandeContrat;
import com.assurance.sante.connect.entity.Police;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.DemandeContratRepository;
import com.assurance.sante.connect.repository.PoliceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DemandeContratService {

    private final DemandeContratRepository repo;
    private final PoliceRepository policeRepo;

    public List<DemandeContrat> getAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public List<DemandeContrat> getByAssure(String email) {
        return repo.findByAssureEmailOrderByCreatedAtDesc(email);
    }

    public List<DemandeContrat> getEnAttente() {
        return repo.findByStatutOrderByCreatedAtDesc(DemandeContrat.StatutDemande.EN_ATTENTE);
    }

    public DemandeContrat creer(Map<String, Object> payload, String assureEmail) {
        Long policeId = Long.parseLong(payload.get("policeId").toString());
        Police police = policeRepo.findById(policeId)
                .orElseThrow(() -> new ResourceNotFoundException("Police introuvable: " + policeId));

        DemandeContrat.TypeDemande type = DemandeContrat.TypeDemande.valueOf(payload.get("type").toString());

        DemandeContrat demande = DemandeContrat.builder()
                .policeNumero(police.getNumero())
                .policeId(policeId)
                .assureEmail(assureEmail)
                .assureNom(payload.getOrDefault("assureNom", "").toString())
                .type(type)
                .statut(DemandeContrat.StatutDemande.EN_ATTENTE)
                .motif(payload.getOrDefault("motif", "").toString())
                .notes(payload.getOrDefault("notes", "").toString())
                .createdAt(LocalDateTime.now())
                .build();

        if (payload.get("dateDebutSouhaitee") != null && !payload.get("dateDebutSouhaitee").toString().isBlank()) {
            demande.setDateDebutSouhaitee(LocalDate.parse(payload.get("dateDebutSouhaitee").toString()));
        }
        if (payload.get("dureeAns") != null) {
            demande.setDureeAns(Integer.parseInt(payload.get("dureeAns").toString()));
        }

        return repo.save(demande);
    }

    public DemandeContrat approuver(Long id, String commentaire) {
        DemandeContrat d = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable: " + id));
        d.setStatut(DemandeContrat.StatutDemande.APPROUVEE);
        d.setCommentaireAdmin(commentaire);
        d.setTraiteeAt(LocalDateTime.now());

        // Si renouvellement → prolonger la police (mettre à ACTIVE)
        if (d.getType() == DemandeContrat.TypeDemande.RENOUVELLEMENT) {
            policeRepo.findById(d.getPoliceId()).ifPresent(p -> {
                p.setStatut(Police.PoliceStatut.ACTIVE);
                if (d.getDateDebutSouhaitee() != null) {
                    p.setDateDebut(d.getDateDebutSouhaitee().atStartOfDay());
                    if (d.getDureeAns() != null) {
                        p.setDateFin(d.getDateDebutSouhaitee().plusYears(d.getDureeAns()).atStartOfDay());
                    }
                }
                policeRepo.save(p);
            });
        }

        // Si résiliation → passer la police à RESILIEE
        if (d.getType() == DemandeContrat.TypeDemande.RESILIATION) {
            policeRepo.findById(d.getPoliceId()).ifPresent(p -> {
                p.setStatut(Police.PoliceStatut.RESILIEE);
                policeRepo.save(p);
            });
        }

        return repo.save(d);
    }

    public DemandeContrat refuser(Long id, String commentaire) {
        DemandeContrat d = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable: " + id));
        d.setStatut(DemandeContrat.StatutDemande.REFUSEE);
        d.setCommentaireAdmin(commentaire);
        d.setTraiteeAt(LocalDateTime.now());
        return repo.save(d);
    }

    public void supprimer(Long id) {
        repo.deleteById(id);
    }
}
