package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.entity.Consultation;
import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.PrestataireDto;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import com.assurance.sante.connect.repository.ConsultationRepository;
import com.assurance.sante.connect.repository.LignePrestationRepository;
import com.assurance.sante.connect.repository.PrestataireRepository;
import com.assurance.sante.connect.repository.PrestationRepository;
import com.assurance.sante.connect.service.PrestataireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Optional;

@RestController
@RequestMapping("/api/prestataires")
@RequiredArgsConstructor
public class PrestataireController {

    private final PrestataireService        prestataireService;
    private final PrestataireRepository     prestataireRepository;
    private final ConsultationRepository    consultationRepository;
    private final PrestationRepository      prestationRepository;
    private final LignePrestationRepository lignePrestationRepository;

    private static final DateTimeFormatter MONTH_FMT =
            DateTimeFormatter.ofPattern("MMM yy", java.util.Locale.FRENCH);

    /** Retourne le prestataire lié au compte connecté (authentification par email). */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PrestataireDto>> getMyPrestataire(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(ApiResponse.<PrestataireDto>error("Non authentifié"));
        }
        String email = auth.getName();
        Optional<Prestataire> opt = prestataireRepository.findFirstByEmail(email);
        if (opt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.<PrestataireDto>error("Aucun prestataire lié à ce compte"));
        }
        return ResponseEntity.ok(ApiResponse.success(PrestataireDto.fromEntity(opt.get())));
    }

    /** Mise à jour partielle du profil prestataire par le prestataire lui-même. */
    @PatchMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<PrestataireDto>> updateMyPrestataire(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(ApiResponse.<PrestataireDto>error("Non authentifié"));
        }
        String email = auth.getName();
        Optional<Prestataire> opt = prestataireRepository.findFirstByEmail(email);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.<PrestataireDto>error("Aucun prestataire lié à ce compte"));
        }
        Prestataire p = opt.get();
        if (body.containsKey("telephone")) p.setTelephone(body.get("telephone"));
        if (body.containsKey("adresse"))   p.setAdresse(body.get("adresse"));
        p.setUpdatedAt(java.time.LocalDateTime.now());
        prestataireRepository.save(p);
        return ResponseEntity.ok(ApiResponse.success(PrestataireDto.fromEntity(p)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPrestataires() {
        List<PrestataireDto> prestataires = prestataireService.getAllPrestataires().stream()
            .map(PrestataireDto::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(Map.of("prestataires", prestataires)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PrestataireDto>> getPrestataireById(@PathVariable Long id) {
        Prestataire prestataire = prestataireService.getPrestataireById(id);
        return ResponseEntity.ok(ApiResponse.success(PrestataireDto.fromEntity(prestataire)));
    }

    /** Statistiques réelles d'un prestataire basées sur ses consultations */
    @GetMapping("/{id}/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPrestataireStats(@PathVariable Long id) {
        Prestataire prestataire = prestataireRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prestataire not found: " + id));

        List<Consultation> consultations = consultationRepository.findByPrestataireId(id);

        // Assurés uniques
        long totalAssures = consultations.stream()
                .filter(c -> c.getAssure() != null)
                .map(c -> c.getAssure().getId())
                .distinct()
                .count();

        // Répartition par statut
        Map<String, Long> parStatut = consultations.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getStatut() != null ? c.getStatut().name() : "INCONNU",
                        Collectors.counting()
                ));

        // Données des 6 derniers mois
        LocalDateTime now        = LocalDateTime.now();
        LocalDateTime sixAgo     = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).minusMonths(5);
        Map<String, Long> byMonth = new TreeMap<>();
        for (int i = 0; i < 6; i++) {
            byMonth.put(sixAgo.plusMonths(i).format(MONTH_FMT), 0L);
        }
        consultations.stream()
                .filter(c -> c.getDateConsultation() != null && !c.getDateConsultation().isBefore(sixAgo))
                .forEach(c -> {
                    String key = c.getDateConsultation().format(MONTH_FMT);
                    if (byMonth.containsKey(key)) byMonth.merge(key, 1L, Long::sum);
                });

        List<Map<String, Object>> monthlyData = byMonth.entrySet().stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("month",         e.getKey());
            m.put("consultations", e.getValue());
            return m;
        }).collect(Collectors.toList());

        // Répartition par statut pour le graphique
        List<Map<String, Object>> statutRepartition = parStatut.entrySet().stream().map(e -> {
            Map<String, Object> m = new HashMap<>();
            m.put("name",  switch (e.getKey()) {
                case "PROGRAMMEE" -> "Programmée";
                case "COMPLETEE"  -> "Complétée";
                case "ANNULEE"    -> "Annulée";
                default           -> e.getKey();
            });
            m.put("value", e.getValue());
            return m;
        }).collect(Collectors.toList());

        long nbPrestations    = prestationRepository.countByPrestataireDemandeurId(id);
        long nbLignesFournies = lignePrestationRepository.countByFourniParId(id);

        Map<String, Object> result = new HashMap<>();
        result.put("prestataire",       PrestataireDto.fromEntity(prestataire));
        result.put("totalConsultations",consultations.size());
        result.put("totalAssures",      totalAssures);
        result.put("parStatut",         parStatut);
        result.put("monthlyData",       monthlyData);
        result.put("statutRepartition", statutRepartition);
        result.put("nbConsultations",   (long) consultations.size());
        result.put("nbPrestations",     nbPrestations);
        result.put("nbLignesFournies",  nbLignesFournies);

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PrestataireDto>> createPrestataire(@RequestBody Prestataire prestataire) {
        return ResponseEntity.ok(ApiResponse.success(
            PrestataireDto.fromEntity(prestataireService.createPrestataire(prestataire))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PrestataireDto>> updatePrestataire(
            @PathVariable Long id, @RequestBody Prestataire prestataireDetails) {
        return ResponseEntity.ok(ApiResponse.success(
            PrestataireDto.fromEntity(prestataireService.updatePrestataire(id, prestataireDetails))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePrestataire(@PathVariable Long id) {
        prestataireService.deletePrestataire(id);
        return ResponseEntity.ok(ApiResponse.success("Prestataire supprimé"));
    }

}
