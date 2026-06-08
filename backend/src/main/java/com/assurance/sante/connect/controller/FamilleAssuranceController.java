package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.FamilleAssurance;
import com.assurance.sante.connect.service.FamilleAssuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/familles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FamilleAssuranceController {

    private final FamilleAssuranceService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FamilleAssurance>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FamilleAssurance>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FamilleAssurance>> create(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success(service.create(data)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FamilleAssurance>> update(
            @PathVariable Long id, @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, data)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Famille supprimée"));
    }
}
