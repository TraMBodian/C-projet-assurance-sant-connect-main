package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.Tarif;
import com.assurance.sante.connect.service.TarifService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tarifs")
@RequiredArgsConstructor
public class TarifController {

    private final TarifService tarifService;

    /** Accessible à tous les utilisateurs authentifiés (pour le calcul de prime) */
    @GetMapping
    public ResponseEntity<ApiResponse<Tarif>> getTarifs() {
        return ResponseEntity.ok(ApiResponse.success(tarifService.getTarifs()));
    }

    /** Réservé aux admins */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Tarif>> updateTarifs(@RequestBody Tarif tarif) {
        Tarif saved = tarifService.saveTarifs(tarif);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
