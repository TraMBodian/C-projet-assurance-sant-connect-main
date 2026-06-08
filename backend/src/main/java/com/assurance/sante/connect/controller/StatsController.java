package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.*;
import com.assurance.sante.connect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final AssureRepository         assureRepository;
    private final PoliceRepository         policeRepository;
    private final SinistreRepository       sinistreRepository;
    private final PrestataireRepository    prestataireRepository;
    private final ConsultationRepository   consultationRepository;
    private final PrescriptionRepository   prescriptionRepository;
    private final UserRepository           userRepository;
    private final PaiementPrimeRepository  paiementPrimeRepository;

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMM yy", java.util.Locale.FRENCH);

    // ── Statistiques publiques (page d'accueil, sans auth) ───────────────────
    @GetMapping("/public")
    @Cacheable(value = "publicStats", unless = "#result == null")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPublicStats() {
        long assuresActifs    = assureRepository.findAll().stream()
            .filter(a -> a.getStatut() == com.assurance.sante.connect.entity.Assure.AssureStatut.ACTIF)
            .count();
        long totalPrestataires = prestataireRepository.count();
        long totalConsultations = consultationRepository.count();
        long completees = consultationRepository.findAll().stream()
            .filter(c -> c.getStatut() == com.assurance.sante.connect.entity.Consultation.ConsultationStatut.COMPLETEE)
            .count();
        double tauxReussite = totalConsultations == 0 ? 100.0
            : Math.round((double) completees / totalConsultations * 1000.0) / 10.0;

        Map<String, Object> data = new HashMap<>();
        data.put("assuresActifs",    assuresActifs);
        data.put("prestataires",     totalPrestataires);
        data.put("consultations",    totalConsultations);
        data.put("tauxReussite",     tauxReussite);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Cacheable(value = "stats", unless = "#result == null")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        LocalDateTime now           = LocalDateTime.now();
        LocalDateTime startOfMonth  = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime startOfLast   = startOfMonth.minusMonths(1);
        LocalDateTime sixMonthsAgo  = startOfMonth.minusMonths(5);

        List<Sinistre>     sinistres     = sinistreRepository.findAll();
        List<Consultation> consultations = consultationRepository.findAll();
        List<User>         users         = userRepository.findAll();

        Map<String, Object> result = new HashMap<>();

        // ── 1. Tendances (mois en cours vs précédent) ────────────────────
        long sinThisMonth  = sinistres.stream().filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(startOfMonth)).count();
        long sinLastMonth  = sinistres.stream().filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(startOfLast) && s.getCreatedAt().isBefore(startOfMonth)).count();
        long conThisMonth  = consultations.stream().filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isBefore(startOfMonth)).count();
        long conLastMonth  = consultations.stream().filter(c -> c.getCreatedAt() != null && !c.getCreatedAt().isBefore(startOfLast) && c.getCreatedAt().isBefore(startOfMonth)).count();
        long assuresTotal  = assureRepository.count();
        long usersActifs   = users.stream().filter(u -> u.getStatus() == User.UserStatus.ACTIVE).count();
        long usersPending  = users.stream().filter(u -> u.getStatus() == User.UserStatus.PENDING).count();

        Map<String, Object> tendances = new HashMap<>();
        tendances.put("sinistresThisMonth", sinThisMonth);
        tendances.put("sinistresLastMonth", sinLastMonth);
        tendances.put("consultationsThisMonth", conThisMonth);
        tendances.put("consultationsLastMonth", conLastMonth);
        tendances.put("variationSinistres", sinLastMonth == 0 ? 0 : Math.round((double)(sinThisMonth - sinLastMonth) / sinLastMonth * 100));
        tendances.put("variationConsultations", conLastMonth == 0 ? 0 : Math.round((double)(conThisMonth - conLastMonth) / conLastMonth * 100));
        result.put("tendances", tendances);

        // ── 2. Sinistres par mois (6 derniers mois) ──────────────────────
        Map<String, long[]> byMonth = new TreeMap<>();
        for (int i = 0; i < 6; i++) {
            LocalDateTime m = sixMonthsAgo.plusMonths(i);
            byMonth.put(m.format(MONTH_FMT), new long[]{0, 0, 0});
        }
        for (Sinistre s : sinistres) {
            if (s.getCreatedAt() == null || s.getCreatedAt().isBefore(sixMonthsAgo)) continue;
            String key = s.getCreatedAt().format(MONTH_FMT);
            if (!byMonth.containsKey(key)) continue;
            byMonth.get(key)[0]++;
            if (s.getStatut() == Sinistre.SinistreStatut.PAYE && s.getMontantAccorde() != null)
                byMonth.get(key)[1] += s.getMontantAccorde().longValue();
            if (s.getStatut() == Sinistre.SinistreStatut.EN_ATTENTE)
                byMonth.get(key)[2]++;
        }
        List<Map<String, Object>> sinistresParMois = byMonth.entrySet().stream().map(e -> {
            Map<String, Object> p = new HashMap<>();
            p.put("mois",          e.getKey());
            p.put("sinistres",     e.getValue()[0]);
            p.put("remboursements",e.getValue()[1]);
            p.put("enAttente",     e.getValue()[2]);
            return p;
        }).collect(Collectors.toList());
        result.put("sinistresParMois", sinistresParMois);

        // ── 3. Répartition des sinistres par statut ───────────────────────
        Map<Sinistre.SinistreStatut, Long> statuts = sinistres.stream()
                .collect(Collectors.groupingBy(Sinistre::getStatut, Collectors.counting()));
        List<Map<String, Object>> sinistresByStatut = Arrays.stream(Sinistre.SinistreStatut.values()).map(s -> {
            String label = switch (s) {
                case EN_ATTENTE -> "En attente";
                case EN_COURS   -> "En cours";
                case APPROUVE   -> "Approuvé";
                case REJETE     -> "Rejeté";
                case PAYE       -> "Payé";
            };
            Map<String, Object> m = new HashMap<>();
            m.put("name",  label);
            m.put("value", statuts.getOrDefault(s, 0L));
            return m;
        }).filter(m -> (long) m.get("value") > 0).collect(Collectors.toList());
        result.put("sinistresByStatut", sinistresByStatut);

        // ── 4. Données financières ────────────────────────────────────────
        BigDecimal totalReclame = sinistres.stream()
                .map(s -> s.getMontantReclamation() != null ? s.getMontantReclamation() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAccorde = sinistres.stream()
                .filter(s -> s.getMontantAccorde() != null)
                .map(Sinistre::getMontantAccorde)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPaye = sinistres.stream()
                .filter(s -> s.getStatut() == Sinistre.SinistreStatut.PAYE && s.getMontantAccorde() != null)
                .map(Sinistre::getMontantAccorde)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalSinistres = sinistres.size();
        long totalApprouves = sinistres.stream().filter(s ->
                s.getStatut() == Sinistre.SinistreStatut.APPROUVE ||
                s.getStatut() == Sinistre.SinistreStatut.PAYE).count();
        int tauxApprobation = totalSinistres == 0 ? 0 : (int) Math.round((double) totalApprouves / totalSinistres * 100);

        Map<String, Object> financier = new HashMap<>();
        financier.put("totalReclame",     totalReclame);
        financier.put("totalAccorde",     totalAccorde);
        financier.put("totalPaye",        totalPaye);
        financier.put("tauxApprobation",  tauxApprobation);
        result.put("financier", financier);

        // ── 5. Top prestataires par consultations ────────────────────────
        Map<String, Long> prestByName = consultations.stream()
                .filter(c -> c.getPrestataire() != null)
                .collect(Collectors.groupingBy(c -> c.getPrestataire().getNom(), Collectors.counting()));
        List<Map<String, Object>> topPrestataires = prestByName.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("nom",           e.getKey());
                    m.put("consultations", e.getValue());
                    return m;
                }).collect(Collectors.toList());
        result.put("topPrestataires", topPrestataires);

        // ── 6. Statistiques utilisateurs ─────────────────────────────────
        Map<String, Object> userStats = new HashMap<>();
        userStats.put("total",        users.size());
        userStats.put("actifs",       usersActifs);
        userStats.put("pending",      usersPending);
        userStats.put("prestataires", users.stream().filter(u -> u.getRole() == User.UserRole.PRESTATAIRE).count());
        userStats.put("clients",      users.stream().filter(u -> u.getRole() == User.UserRole.CLIENT).count());
        userStats.put("admins",       users.stream().filter(u -> u.getRole() == User.UserRole.ADMIN).count());
        result.put("userStats", userStats);

        // ── 7. Ratio S/P (Sinistres / Primes) ────────────────────────────
        BigDecimal totalPrimes = policeRepository.findAll().stream()
                .map(p -> p.getMontantPrime() != null ? p.getMontantPrime() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        double ratioSP = 0.0;
        if (totalPrimes.compareTo(BigDecimal.ZERO) > 0) {
            ratioSP = totalReclame.divide(totalPrimes, 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100;
        }
        Map<String, Object> ratioSPData = new HashMap<>();
        ratioSPData.put("totalSinistres",  totalReclame);
        ratioSPData.put("totalPrimes",     totalPrimes);
        ratioSPData.put("ratio",           Math.round(ratioSP * 10.0) / 10.0);
        ratioSPData.put("sain",            ratioSP < 70);  // seuil standard assurance
        result.put("ratioSP", ratioSPData);

        // ── 8. Résumé global ──────────────────────────────────────────────
        result.put("totalAssures",      assuresTotal);
        result.put("totalPolices",      policeRepository.count());
        result.put("totalSinistres",    totalSinistres);
        result.put("totalPrestataires", prestataireRepository.count());
        result.put("totalConsultations",consultations.size());
        result.put("totalPrescriptions",prescriptionRepository.count());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /** Tableau de bord financier : encaissements vs remboursements sur 12 mois */
    @GetMapping("/financier")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFinancier() {
        LocalDateTime now          = LocalDateTime.now();
        LocalDateTime twelveAgo   = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).minusMonths(11);
        DateTimeFormatter fmt      = DateTimeFormatter.ofPattern("MMM yy", java.util.Locale.FRENCH);

        // Initialiser 12 mois
        Map<String, long[]> monthly = new TreeMap<>();
        for (int i = 0; i < 12; i++) {
            monthly.put(twelveAgo.plusMonths(i).format(fmt), new long[]{0, 0});
        }

        // Encaissements (primes payées)
        paiementPrimeRepository.findAll().stream()
            .filter(p -> p.getStatut() == PaiementPrime.StatutPaiement.PAYE
                      && p.getDatePaiement() != null
                      && !p.getDatePaiement().isBefore(twelveAgo))
            .forEach(p -> {
                String key = p.getDatePaiement().format(fmt);
                if (monthly.containsKey(key)) {
                    monthly.get(key)[0] += p.getMontant() != null ? p.getMontant().longValue() : 0;
                }
            });

        // Remboursements (sinistres payés)
        sinistreRepository.findAll().stream()
            .filter(s -> s.getStatut() == Sinistre.SinistreStatut.PAYE
                      && s.getMontantAccorde() != null
                      && s.getUpdatedAt() != null
                      && !s.getUpdatedAt().isBefore(twelveAgo))
            .forEach(s -> {
                String key = s.getUpdatedAt().format(fmt);
                if (monthly.containsKey(key)) {
                    monthly.get(key)[1] += s.getMontantAccorde().longValue();
                }
            });

        List<Map<String, Object>> cashflow = monthly.entrySet().stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("mois",          e.getKey());
            m.put("encaissements", e.getValue()[0]);
            m.put("remboursements",e.getValue()[1]);
            m.put("solde",         e.getValue()[0] - e.getValue()[1]);
            return m;
        }).collect(Collectors.toList());

        // KPIs globaux
        BigDecimal totalEncaissements = paiementPrimeRepository.findAll().stream()
            .filter(p -> p.getStatut() == PaiementPrime.StatutPaiement.PAYE && p.getMontant() != null)
            .map(PaiementPrime::getMontant).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRemboursements = sinistreRepository.findAll().stream()
            .filter(s -> s.getStatut() == Sinistre.SinistreStatut.PAYE && s.getMontantAccorde() != null)
            .map(Sinistre::getMontantAccorde).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal soldeNet = totalEncaissements.subtract(totalRemboursements);

        double ratioSP = totalEncaissements.compareTo(BigDecimal.ZERO) > 0
            ? totalRemboursements.divide(totalEncaissements, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0;

        long primesPendantes  = paiementPrimeRepository.findAll().stream()
            .filter(p -> p.getStatut() == PaiementPrime.StatutPaiement.EN_ATTENTE).count();
        long sinistresEnAttente = sinistreRepository.findAll().stream()
            .filter(s -> s.getStatut() == Sinistre.SinistreStatut.EN_ATTENTE).count();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("cashflow",            cashflow);
        result.put("totalEncaissements",  totalEncaissements);
        result.put("totalRemboursements", totalRemboursements);
        result.put("soldeNet",            soldeNet);
        result.put("ratioSP",             Math.round(ratioSP * 10.0) / 10.0);
        result.put("primesPendantes",     primesPendantes);
        result.put("sinistresEnAttente",  sinistresEnAttente);

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
