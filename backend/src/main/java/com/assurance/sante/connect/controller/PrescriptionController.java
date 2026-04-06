package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.entity.Prescription;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8084"})
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPrescriptions() {
        List<Prescription> prescriptions = prescriptionService.getAllPrescriptions();
        return ResponseEntity.ok(ApiResponse.success(Map.of("prescriptions", prescriptions)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Prescription>> getPrescriptionById(@PathVariable Long id) {
        Prescription prescription = prescriptionService.getPrescriptionById(id);
        return ResponseEntity.ok(ApiResponse.success(prescription));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Prescription>> createPrescription(@RequestBody Prescription prescription) {
        Prescription createdPrescription = prescriptionService.createPrescription(prescription);
        return ResponseEntity.ok(ApiResponse.success(createdPrescription));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Prescription>> updatePrescription(@PathVariable Long id, @RequestBody Prescription prescriptionDetails) {
        Prescription updatedPrescription = prescriptionService.updatePrescription(id, prescriptionDetails);
        return ResponseEntity.ok(ApiResponse.success(updatedPrescription));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deletePrescription(@PathVariable Long id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.ok(ApiResponse.success("Prescription deleted successfully"));
    }
}
