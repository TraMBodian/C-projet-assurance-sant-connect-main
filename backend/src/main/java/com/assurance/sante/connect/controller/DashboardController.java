package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.Sinistre;
import com.assurance.sante.connect.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final AssureRepository assureRepository;
    private final PoliceRepository policeRepository;
    private final SinistreRepository sinistreRepository;
    private final PrestataireRepository prestataireRepository;
    private final ConsultationRepository consultationRepository;
    private final PrescriptionRepository prescriptionRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        List<Sinistre> sinistres = sinistreRepository.findAll();

        long sinistresEnAttente = sinistres.stream()
                .filter(s -> s.getStatut() == Sinistre.SinistreStatut.EN_ATTENTE).count();
        long sinistresApprouves = sinistres.stream()
                .filter(s -> s.getStatut() == Sinistre.SinistreStatut.APPROUVE).count();
        long sinistresPaies = sinistres.stream()
                .filter(s -> s.getStatut() == Sinistre.SinistreStatut.PAYE).count();

        BigDecimal montantRembourse = sinistres.stream()
                .filter(s -> s.getStatut() == Sinistre.SinistreStatut.PAYE && s.getMontantAccorde() != null)
                .map(Sinistre::getMontantAccorde)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Recent activity from last 10 sinistres
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        List<Map<String, Object>> recentActivity = sinistres.stream()
                .sorted(Comparator.comparing(Sinistre::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(s -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", s.getId());
                    item.put("action", "Sinistre " + s.getNumero());
                    item.put("detail", s.getAssure() != null ? s.getAssure().getNom() + " " + s.getAssure().getPrenom() : "");
                    item.put("type", s.getStatut().name().toLowerCase());
                    item.put("date", s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
                    item.put("time", s.getCreatedAt() != null ? s.getCreatedAt().format(fmt) : null);
                    return item;
                })
                .collect(Collectors.toList());

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAssures", assureRepository.count());
        stats.put("totalPolices", policeRepository.count());
        stats.put("totalSinistres", sinistres.size());
        stats.put("totalPrestataires", prestataireRepository.count());
        stats.put("totalConsultations", consultationRepository.count());
        stats.put("totalPrescriptions", prescriptionRepository.count());
        stats.put("sinistresEnAttente", sinistresEnAttente);
        stats.put("sinistresApprouves", sinistresApprouves);
        stats.put("sinistresPaies", sinistresPaies);
        stats.put("montantRembourse", montantRembourse);
        stats.put("recentActivity", recentActivity);
        // Chart data: sinistres par mois (6 derniers mois)
        Map<String, long[]> byMonth = new TreeMap<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yy", java.util.Locale.FRENCH);
        java.time.LocalDateTime sixMonthsAgo = java.time.LocalDateTime.now().minusMonths(5).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        for (int i = 0; i < 6; i++) {
            java.time.LocalDateTime m = sixMonthsAgo.plusMonths(i);
            byMonth.put(m.format(monthFmt), new long[]{0, 0});
        }
        for (Sinistre s : sinistres) {
            if (s.getCreatedAt() != null && !s.getCreatedAt().isBefore(sixMonthsAgo)) {
                String key = s.getCreatedAt().format(monthFmt);
                if (byMonth.containsKey(key)) {
                    byMonth.get(key)[0]++;
                    if (s.getStatut() == Sinistre.SinistreStatut.PAYE && s.getMontantAccorde() != null) {
                        byMonth.get(key)[1] += s.getMontantAccorde().longValue();
                    }
                }
            }
        }
        List<Map<String, Object>> chartData = byMonth.entrySet().stream().map(e -> {
            Map<String, Object> point = new HashMap<>();
            point.put("mois", e.getKey());
            point.put("sinistres", e.getValue()[0]);
            point.put("remboursements", e.getValue()[1]);
            return point;
        }).collect(Collectors.toList());
        stats.put("chartData", chartData);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
