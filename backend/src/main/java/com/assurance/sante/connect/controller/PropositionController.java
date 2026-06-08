package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.PropositionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/propositions")
@RequiredArgsConstructor
// Données commerciales sensibles (PII souscripteurs) — réservées à l'administration
@PreAuthorize("hasRole('ADMIN')")
public class PropositionController {

    private static final List<PropositionDto> PROPOSITIONS = new ArrayList<>();
    private static final AtomicInteger COUNTER = new AtomicInteger();

    static {
        String now = OffsetDateTime.now(ZoneOffset.UTC).toString();
        PROPOSITIONS.add(PropositionDto.builder()
            .id("prop-1")
            .type(PropositionDto.TypeProposition.FAMILLE)
            .statut(PropositionDto.StatutProposition.brouillon)
            .reference("PROP-2026-0001")
            .createdAt(now)
            .updatedAt(now)
            .envoyeeAt(null)
            .accepteeAt(null)
            .policeId(null)
            .famille(PropositionDto.PropositionFamilleData.builder()
                .souscripteurNom("Dupont Jean")
                .souscripteurEmail("jean.dupont@email.com")
                .souscripteurTel("+221 77 123 45 67")
                .souscripteurAdresse("123 Rue de la Paix, Dakar")
                .nbAdultes(2)
                .nbEnfants(1)
                .nbPersonnesAgees(0)
                .typeGarantie("Standard")
                .dureeAns(1)
                .primeEstimee(45000.0)
                .tauxRemboursement(80.0)
                .observations("")
                .build())
            .groupe(null)
            .build());

        PROPOSITIONS.add(PropositionDto.builder()
            .id("prop-2")
            .type(PropositionDto.TypeProposition.GROUPE)
            .statut(PropositionDto.StatutProposition.envoyee)
            .reference("PROP-2026-0002")
            .createdAt(now)
            .updatedAt(now)
            .envoyeeAt(now)
            .accepteeAt(null)
            .policeId(null)
            .famille(null)
            .groupe(PropositionDto.PropositionGroupeData.builder()
                .entreprise("TechStartup SA")
                .secteur("Informatique")
                .contactNom("Sall Moussa")
                .contactEmail("moussa@techstartup.sn")
                .contactTel("+221 77 234 56 78")
                .nbAdultes(15)
                .nbEnfants(3)
                .nbPersonnesAgees(2)
                .typeGarantie("Confort")
                .dureeAns(2)
                .primeEstimee(320000.0)
                .tauxRemboursement(85.0)
                .observations("PME dynamique, 20 employés")
                .build())
            .build());
        COUNTER.set(PROPOSITIONS.size() + 1);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PropositionDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(new ArrayList<>(PROPOSITIONS)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PropositionDto>> getById(@PathVariable String id) {
        return findById(id)
            .map(prop -> ResponseEntity.ok(ApiResponse.success(prop)))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PropositionDto>> create(@RequestBody PropositionDto payload) {
        String now = OffsetDateTime.now(ZoneOffset.UTC).toString();
        String id = UUID.randomUUID().toString();
        String reference = String.format("PROP-%d-%04d", OffsetDateTime.now(ZoneOffset.UTC).getYear(), COUNTER.getAndIncrement());

        PropositionDto proposition = PropositionDto.builder()
            .id(id)
            .type(payload.getType())
            .statut(payload.getStatut())
            .reference(reference)
            .createdAt(now)
            .updatedAt(now)
            .envoyeeAt(payload.getEnvoyeeAt())
            .accepteeAt(payload.getAccepteeAt())
            .policeId(payload.getPoliceId())
            .famille(payload.getFamille())
            .groupe(payload.getGroupe())
            .build();

        PROPOSITIONS.add(0, proposition);
        return ResponseEntity.ok(ApiResponse.success(proposition));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PropositionDto>> update(@PathVariable String id, @RequestBody PropositionDto payload) {
        Optional<PropositionDto> existing = findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PropositionDto proposition = existing.get();
        if (payload.getStatut() != null) {
            proposition.setStatut(payload.getStatut());
            if (payload.getStatut() == PropositionDto.StatutProposition.envoyee) {
                proposition.setEnvoyeeAt(OffsetDateTime.now(ZoneOffset.UTC).toString());
            } else if (payload.getStatut() == PropositionDto.StatutProposition.acceptee) {
                proposition.setAccepteeAt(OffsetDateTime.now(ZoneOffset.UTC).toString());
            }
        }
        if (payload.getPoliceId() != null) {
            proposition.setPoliceId(payload.getPoliceId());
        }
        if (payload.getFamille() != null) {
            proposition.setFamille(payload.getFamille());
        }
        if (payload.getGroupe() != null) {
            proposition.setGroupe(payload.getGroupe());
        }
        if (payload.getType() != null) {
            proposition.setType(payload.getType());
        }
        proposition.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC).toString());

        return ResponseEntity.ok(ApiResponse.success(proposition));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        Optional<PropositionDto> existing = findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PROPOSITIONS.remove(existing.get());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private Optional<PropositionDto> findById(String id) {
        return PROPOSITIONS.stream().filter(prop -> prop.getId().equals(id)).findFirst();
    }
}
