package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.GroupeAssurance;
import com.assurance.sante.connect.service.GroupeAssuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groupes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GroupeAssuranceController {

    private final GroupeAssuranceService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GroupeAssurance>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupeAssurance>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GroupeAssurance>> create(@RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success(service.create(data)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupeAssurance>> update(
            @PathVariable Long id, @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, data)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Groupe supprimé"));
    }
}
