package com.assurance.sante.connect.service;

import com.assurance.sante.connect.dto.CreateSinistreRequest;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.Police;
import com.assurance.sante.connect.entity.Sinistre;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.PoliceRepository;
import com.assurance.sante.connect.repository.SinistreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SinistreService {

    private final SinistreRepository sinistreRepository;
    private final AssureRepository assureRepository;
    private final PoliceRepository policeRepository;

    public List<Sinistre> getAllSinistres() {
        return sinistreRepository.findAll();
    }

    public Sinistre getSinistreById(Long id) {
        return sinistreRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sinistre not found with id: " + id));
    }

    public Sinistre createSinistre(CreateSinistreRequest request) {
        Assure assure = assureRepository.findById(request.getAssureId())
            .orElseThrow(() -> new ResourceNotFoundException("Assuré non trouvé avec id: " + request.getAssureId()));

        Police police = policeRepository.findById(request.getPoliceId())
            .orElseThrow(() -> new ResourceNotFoundException("Police non trouvée avec id: " + request.getPoliceId()));

        Sinistre sinistre = Sinistre.builder()
            .numero(request.getNumero() != null && !request.getNumero().isBlank() ? request.getNumero() : generateNumero())
            .type(request.getType())
            .assure(assure)
            .police(police)
            .description(request.getDescription())
            .montantReclamation(request.getMontantReclamation())
            .statut(Sinistre.SinistreStatut.valueOf(request.getStatut()))
            .dateSinistre(parseDate(request.getDateSinistre()))
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        return sinistreRepository.save(sinistre);
    }

    public Sinistre updateSinistre(Long id, Sinistre sinistreDetails) {
        Sinistre sinistre = sinistreRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sinistre not found with id: " + id));

        if (sinistreDetails.getType() != null) sinistre.setType(sinistreDetails.getType());
        if (sinistreDetails.getDescription() != null) sinistre.setDescription(sinistreDetails.getDescription());
        if (sinistreDetails.getMontantReclamation() != null) sinistre.setMontantReclamation(sinistreDetails.getMontantReclamation());
        if (sinistreDetails.getMontantAccorde() != null) sinistre.setMontantAccorde(sinistreDetails.getMontantAccorde());
        if (sinistreDetails.getStatut() != null) sinistre.setStatut(sinistreDetails.getStatut());

        return sinistreRepository.save(sinistre);
    }

    public void deleteSinistre(Long id) {
        Sinistre sinistre = sinistreRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sinistre not found with id: " + id));
        sinistreRepository.delete(sinistre);
    }

    private String generateNumero() {
        return "SIN-" + System.currentTimeMillis();
    }

    private LocalDateTime parseDate(String date) {
        if (date == null || date.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            LocalDate localDate = LocalDate.parse(date);
            return localDate.atStartOfDay();
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Format de date invalide pour dateSinistre");
        }
    }
}
