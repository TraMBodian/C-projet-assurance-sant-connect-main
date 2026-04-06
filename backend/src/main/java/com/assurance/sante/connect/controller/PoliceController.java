package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.entity.Police;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.PoliceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/polices")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8084"})
public class PoliceController {

    private final PoliceService policeService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPolices() {
        List<Police> polices = policeService.getAllPolices();
        return ResponseEntity.ok(ApiResponse.success(Map.of("polices", polices)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Police>> getPoliceById(@PathVariable Long id) {
        Police police = policeService.getPoliceById(id);
        return ResponseEntity.ok(ApiResponse.success(police));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Police>> createPolice(@RequestBody Police police) {
        Police createdPolice = policeService.createPolice(police);
        return ResponseEntity.ok(ApiResponse.success(createdPolice));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Police>> updatePolice(@PathVariable Long id, @RequestBody Police policeDetails) {
        Police updatedPolice = policeService.updatePolice(id, policeDetails);
        return ResponseEntity.ok(ApiResponse.success(updatedPolice));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deletePolice(@PathVariable Long id) {
        policeService.deletePolice(id);
        return ResponseEntity.ok(ApiResponse.success("Police deleted successfully"));
    }
}
