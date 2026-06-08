package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.PaiementPrime;
import com.assurance.sante.connect.entity.Police;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.PaiementPrimeRepository;
import com.assurance.sante.connect.repository.PoliceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaiementPrimeService {

    private final PaiementPrimeRepository paiementRepository;
    private final PoliceRepository         policeRepository;
    private final AssureRepository         assureRepository;

    private static final DateTimeFormatter NUM_FMT  = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final DateTimeFormatter MOIS_FMT = DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH);

    // ── Lecture ────────────────────────────────────────────────────────────────

    public List<PaiementPrime> getAll() {
        return paiementRepository.findAllByOrderByDateEcheanceDesc();
    }

    public List<PaiementPrime> getByPolice(Long policeId) {
        return paiementRepository.findByPoliceIdOrderByDateEcheanceDesc(policeId);
    }

    public List<PaiementPrime> getByAssure(Long assureId) {
        return paiementRepository.findByAssureIdOrderByDateEcheanceDesc(assureId);
    }

    public List<PaiementPrime> getEnRetard() {
        return paiementRepository.findByStatutOrderByDateEcheanceAsc(PaiementPrime.StatutPaiement.EN_RETARD);
    }

    public PaiementPrime getById(Long id) {
        return paiementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement non trouvé : " + id));
    }

    // ── Création ──────────────────────────────────────────────────────────────

    @Transactional
    public PaiementPrime creer(Map<String, Object> data) {
        Long policeId = toLong(data.get("policeId"));
        Police police = policeRepository.findById(policeId)
                .orElseThrow(() -> new ResourceNotFoundException("Police non trouvée : " + policeId));

        Assure assure = null;
        if (police.getAssure() != null) assure = police.getAssure();
        if (data.containsKey("assureId") && data.get("assureId") != null) {
            Long aid = toLong(data.get("assureId"));
            assure = assureRepository.findById(aid)
                    .orElseThrow(() -> new ResourceNotFoundException("Assuré non trouvé : " + aid));
        }

        BigDecimal montant = police.getMontantPrime() != null
                ? police.getMontantPrime()
                : BigDecimal.ZERO;
        if (data.containsKey("montant") && data.get("montant") != null) {
            montant = new BigDecimal(data.get("montant").toString());
        }

        LocalDateTime echeance = LocalDateTime.now().plusMonths(1);
        if (data.containsKey("dateEcheance") && data.get("dateEcheance") != null) {
            echeance = LocalDateTime.parse(data.get("dateEcheance").toString());
        }

        String periode = MOIS_FMT.format(echeance);
        if (data.containsKey("periode") && data.get("periode") != null) {
            periode = data.get("periode").toString();
        }

        String numero = "PAI-" + LocalDateTime.now().format(NUM_FMT);

        PaiementPrime p = PaiementPrime.builder()
                .numero(numero)
                .police(police)
                .assure(assure)
                .montant(montant)
                .periode(periode)
                .dateEcheance(echeance)
                .statut(PaiementPrime.StatutPaiement.EN_ATTENTE)
                .notes(data.containsKey("notes") ? (String) data.get("notes") : null)
                .build();

        return paiementRepository.save(p);
    }

    // ── Enregistrer un paiement ───────────────────────────────────────────────

    @Transactional
    public PaiementPrime enregistrerPaiement(Long id, Map<String, Object> data) {
        PaiementPrime p = getById(id);

        p.setStatut(PaiementPrime.StatutPaiement.PAYE);
        p.setDatePaiement(LocalDateTime.now());
        if (data.containsKey("moyenPaiement"))       p.setMoyenPaiement((String) data.get("moyenPaiement"));
        if (data.containsKey("referenceTransaction")) p.setReferenceTransaction((String) data.get("referenceTransaction"));
        if (data.containsKey("notes"))               p.setNotes((String) data.get("notes"));
        p.setUpdatedAt(LocalDateTime.now());

        return paiementRepository.save(p);
    }

    // ── Marquer en retard ─────────────────────────────────────────────────────

    @Transactional
    public PaiementPrime marquerEnRetard(Long id) {
        PaiementPrime p = getById(id);
        if (p.getStatut() == PaiementPrime.StatutPaiement.EN_ATTENTE) {
            p.setStatut(PaiementPrime.StatutPaiement.EN_RETARD);
            p.setUpdatedAt(LocalDateTime.now());
            paiementRepository.save(p);
        }
        return p;
    }

    // ── Suppression ───────────────────────────────────────────────────────────

    @Transactional
    public void supprimer(Long id) {
        PaiementPrime p = getById(id);
        paiementRepository.delete(p);
    }

    private Long toLong(Object v) {
        if (v == null) throw new IllegalArgumentException("Identifiant manquant");
        return Long.parseLong(v.toString());
    }
}
