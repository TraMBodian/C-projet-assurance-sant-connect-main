package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.AuditLog;
import com.assurance.sante.connect.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    /** Lecture paginée avec filtres */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLogs(
            @RequestParam(defaultValue = "0")           int page,
            @RequestParam(defaultValue = "50")          int size,
            @RequestParam(required = false)             String search,
            @RequestParam(required = false)             String action,
            @RequestParam(required = false)             String entity) {

        PageRequest pageable = PageRequest.of(page, Math.min(size, 200),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLog> result = auditLogService.getLogs(search, action, entity, pageable);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "logs",          result.getContent(),
            "totalElements", result.getTotalElements(),
            "totalPages",    result.getTotalPages(),
            "page",          result.getNumber(),
            "size",          result.getSize()
        )));
    }

    /** Export CSV complet — applique les mêmes filtres, pas de pagination */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entity) {

        // Récupérer jusqu'à 50 000 entrées pour l'export
        PageRequest pageable = PageRequest.of(0, 50_000,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AuditLog> logs = auditLogService.getLogs(search, action, entity, pageable).getContent();

        String csv = buildCsv(logs);
        byte[] bytes = ("﻿" + csv).getBytes(java.nio.charset.StandardCharsets.UTF_8);

        String filename = "audit-logs-" + LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm")) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .body(bytes);
    }

    /** Purge — supprime les entrées plus anciennes que N jours (défaut : 90 jours) */
    @DeleteMapping("/purge")
    public ResponseEntity<ApiResponse<String>> purge(
            @RequestParam(defaultValue = "90") int olderThanDays) {
        if (olderThanDays < 30) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("La durée de rétention minimale est de 30 jours"));
        }
        LocalDateTime cutoff = LocalDateTime.now().minusDays(olderThanDays);
        long deleted = auditLogService.purge(cutoff);
        return ResponseEntity.ok(ApiResponse.success(
            "Purge effectuée : " + deleted + " entrées supprimées (antérieures à " + olderThanDays + " jours)"));
    }

    // ── CSV builder ───────────────────────────────────────────────────────────

    private String buildCsv(List<AuditLog> logs) {
        StringBuilder sb = new StringBuilder();
        sb.append("Date,Action,Entité,ID Entité,Utilisateur,Rôle,Détail,Adresse IP\n");
        for (AuditLog l : logs) {
            sb.append(escape(l.getCreatedAt() != null ? l.getCreatedAt().format(DT) : "")).append(",");
            sb.append(escape(l.getAction())).append(",");
            sb.append(escape(l.getEntity())).append(",");
            sb.append(l.getEntityId() != null ? l.getEntityId() : "").append(",");
            sb.append(escape(l.getUserEmail())).append(",");
            sb.append(escape(l.getUserRole())).append(",");
            sb.append(escape(l.getDetail())).append(",");
            sb.append(escape(l.getIpAddress())).append("\n");
        }
        return sb.toString();
    }

    private String escape(String v) {
        if (v == null) return "";
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }
}
