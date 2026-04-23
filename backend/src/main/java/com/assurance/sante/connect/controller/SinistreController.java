package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.entity.Sinistre;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.SinistreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sinistres")
@RequiredArgsConstructor
public class SinistreController {

    private final SinistreService sinistreService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllSinistres() {
        List<Sinistre> sinistres = sinistreService.getAllSinistres();
        return ResponseEntity.ok(ApiResponse.success(Map.of("sinistres", sinistres)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Sinistre>> getSinistreById(@PathVariable Long id) {
        Sinistre sinistre = sinistreService.getSinistreById(id);
        return ResponseEntity.ok(ApiResponse.success(sinistre));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Sinistre>> createSinistre(@RequestBody Sinistre sinistre) {
        Sinistre createdSinistre = sinistreService.createSinistre(sinistre);
        return ResponseEntity.ok(ApiResponse.success(createdSinistre));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Sinistre>> updateSinistre(@PathVariable Long id, @RequestBody Sinistre sinistreDetails) {
        Sinistre updatedSinistre = sinistreService.updateSinistre(id, sinistreDetails);
        return ResponseEntity.ok(ApiResponse.success(updatedSinistre));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteSinistre(@PathVariable Long id) {
        sinistreService.deleteSinistre(id);
        return ResponseEntity.ok(ApiResponse.success("Sinistre deleted successfully"));
    }
}
