package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Tarif;
import com.assurance.sante.connect.repository.TarifRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TarifService {

    private final TarifRepository tarifRepository;

    // Valeurs par défaut si aucun tarif en BDD
    private static final Tarif DEFAULTS = Tarif.builder()
            .primeEnfant(237_500.0)
            .primeAdulte(475_000.0)
            .primeAdulteAge(712_500.0)
            .tauxTaxe(10.0)
            .tauxCP(10.0)
            .tauxRemboursement(80.0)
            .plafondDentaire(250_000.0)
            .plafondOptique(250_000.0)
            .plafondHospitalisationJour(45_000.0)
            .plafondOrthophonie(100_000.0)
            .plafondMaterniteSimple(400_000.0)
            .plafondMaterniteGemellaire(500_000.0)
            .plafondMaterniteChirurgical(600_000.0)
            .plafondTransport(100_000.0)
            .build();

    public Tarif getTarifs() {
        return tarifRepository.findTopByOrderByUpdatedAtDesc().orElse(DEFAULTS);
    }

    @Transactional
    public Tarif saveTarifs(Tarif tarif) {
        // Toujours une seule ligne en base (upsert)
        return tarifRepository.findTopByOrderByUpdatedAtDesc()
                .map(existing -> {
                    tarif.setId(existing.getId());
                    return tarifRepository.save(tarif);
                })
                .orElseGet(() -> tarifRepository.save(tarif));
    }
}
