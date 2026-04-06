package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.AssureDto;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.AssureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assures")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8084"})
public class AssureController {

    private final AssureService assureService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllAssures() {
        List<AssureDto> assures = assureService.getAllAssures();
        return ResponseEntity.ok(ApiResponse.success(Map.of("assures", assures)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssureDto>> getAssureById(@PathVariable Long id) {
        AssureDto assure = assureService.getAssureById(id);
        return ResponseEntity.ok(ApiResponse.success(assure));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AssureDto>> createAssure(@RequestBody AssureDto assureDto) {
        AssureDto createdAssure = assureService.createAssure(assureDto);
        return ResponseEntity.ok(ApiResponse.success(createdAssure));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AssureDto>> updateAssure(@PathVariable Long id, @RequestBody AssureDto assureDto) {
        AssureDto updatedAssure = assureService.updateAssure(id, assureDto);
        return ResponseEntity.ok(ApiResponse.success(updatedAssure));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAssure(@PathVariable Long id) {
        assureService.deleteAssure(id);
        return ResponseEntity.ok(ApiResponse.success("Assure deleted successfully"));
    }
}
