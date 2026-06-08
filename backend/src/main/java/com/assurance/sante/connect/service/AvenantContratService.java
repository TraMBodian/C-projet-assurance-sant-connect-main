package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.AvenantContrat;
import com.assurance.sante.connect.entity.Police;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.AvenantContratRepository;
import com.assurance.sante.connect.repository.PoliceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AvenantContratService {

    private final AvenantContratRepository repo;
    private final PoliceRepository policeRepo;

    private static final DateTimeFormatter NUM_FMT =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    public List<AvenantContrat> getAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public List<AvenantContrat> getByAssure(String email) {
        return repo.findByAssureEmailOrderByCreatedAtDesc(email);
    }

    public List<AvenantContrat> getByPolice(Long policeId) {
        return repo.findByPoliceIdOrderByCreatedAtDesc(policeId);
    }

    public List<AvenantContrat> getEnAttente() {
        return repo.findByStatutOrderByCreatedAtDesc(AvenantContrat.StatutAvenant.EN_ATTENTE);
    }

    public AvenantContrat creer(Map<String, Object> payload, String assureEmail) {
        Long policeId = Long.parseLong(payload.get("policeId").toString());
        Police police = policeRepo.findById(policeId)
                .orElseThrow(() -> new ResourceNotFoundException("Police introuvable: " + policeId));

        AvenantContrat.TypeAvenant type = AvenantContrat.TypeAvenant
                .valueOf(payload.get("type").toString());

        String numero = "AVN-" + LocalDateTime.now().format(NUM_FMT);

        AvenantContrat avenant = AvenantContrat.builder()
                .numero(numero)
                .policeId(policeId)
                .policeNumero(police.getNumero())
                .assureEmail(assureEmail)
                .assureNom(payload.getOrDefault("assureNom", "").toString())
                .type(type)
                .statut(AvenantContrat.StatutAvenant.EN_ATTENTE)
                .ancienneValeur(payload.getOrDefault("ancienneValeur", "").toString())
                .nouvelleValeur(payload.getOrDefault("nouvelleValeur", "").toString())
                .description(payload.getOrDefault("description", "").toString())
                .createdAt(LocalDateTime.now())
                .build();

        return repo.save(avenant);
    }

    public AvenantContrat approuver(Long id, String commentaire) {
        AvenantContrat a = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avenant introuvable: " + id));
        a.setStatut(AvenantContrat.StatutAvenant.APPROUVE);
        a.setCommentaireAdmin(commentaire);
        a.setTraiteAt(LocalDateTime.now());

        // Application automatique selon le type
        appliquerSurPolice(a);
        a.setStatut(AvenantContrat.StatutAvenant.APPLIQUE);

        return repo.save(a);
    }

    private void appliquerSurPolice(AvenantContrat a) {
        policeRepo.findById(a.getPoliceId()).ifPresent(p -> {
            switch (a.getType()) {
                case MODIFICATION_COUVERTURE -> {
                    if (a.getNouvelleValeur() != null && !a.getNouvelleValeur().isBlank()) {
                        p.setCouverture(a.getNouvelleValeur());
                    }
                }
                case MODIFICATION_PRIME -> {
                    try {
                        p.setMontantPrime(new BigDecimal(a.getNouvelleValeur().trim()));
                    } catch (NumberFormatException ignored) {}
                }
                case PROLONGATION -> {
                    // La nouvelleValeur contient la nouvelle date de fin au format ISO
                    try {
                        p.setDateFin(LocalDateTime.parse(a.getNouvelleValeur().trim()));
                    } catch (Exception ignored) {}
                }
                // AJOUT_BENEFICIAIRE, MODIFICATION_ADRESSE, AUTRE → traitement manuel
                default -> {}
            }
            p.setUpdatedAt(LocalDateTime.now());
            policeRepo.save(p);
        });
    }

    public AvenantContrat refuser(Long id, String commentaire) {
        AvenantContrat a = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avenant introuvable: " + id));
        a.setStatut(AvenantContrat.StatutAvenant.REFUSE);
        a.setCommentaireAdmin(commentaire);
        a.setTraiteAt(LocalDateTime.now());
        return repo.save(a);
    }

    public void supprimer(Long id) {
        repo.deleteById(id);
    }
}
