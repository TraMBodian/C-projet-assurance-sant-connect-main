package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.entity.Prestataire;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.PrestataireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prestataires")
@RequiredArgsConstructor
public class PrestataireController {

    private final PrestataireService prestataireService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPrestataires() {
        List<Prestataire> prestataires = prestataireService.getAllPrestataires();
        return ResponseEntity.ok(ApiResponse.success(Map.of("prestataires", prestataires)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Prestataire>> getPrestataireById(@PathVariable Long id) {
        Prestataire prestataire = prestataireService.getPrestataireById(id);
        return ResponseEntity.ok(ApiResponse.success(prestataire));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Prestataire>> createPrestataire(@RequestBody Prestataire prestataire) {
        Prestataire createdPrestataire = prestataireService.createPrestataire(prestataire);
        return ResponseEntity.ok(ApiResponse.success(createdPrestataire));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Prestataire>> updatePrestataire(@PathVariable Long id, @RequestBody Prestataire prestataireDetails) {
        Prestataire updatedPrestataire = prestataireService.updatePrestataire(id, prestataireDetails);
        return ResponseEntity.ok(ApiResponse.success(updatedPrestataire));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deletePrestataire(@PathVariable Long id) {
        prestataireService.deletePrestataire(id);
        return ResponseEntity.ok(ApiResponse.success("Prestataire deleted successfully"));
    }
}
