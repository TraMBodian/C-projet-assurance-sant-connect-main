package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.entity.Consultation;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.ConsultationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:8084"})
public class ConsultationController {

    private final ConsultationService consultationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllConsultations() {
        List<Consultation> consultations = consultationService.getAllConsultations();
        return ResponseEntity.ok(ApiResponse.success(Map.of("consultations", consultations)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Consultation>> getConsultationById(@PathVariable Long id) {
        Consultation consultation = consultationService.getConsultationById(id);
        return ResponseEntity.ok(ApiResponse.success(consultation));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Consultation>> createConsultation(@RequestBody Consultation consultation) {
        Consultation createdConsultation = consultationService.createConsultation(consultation);
        return ResponseEntity.ok(ApiResponse.success(createdConsultation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Consultation>> updateConsultation(@PathVariable Long id, @RequestBody Consultation consultationDetails) {
        Consultation updatedConsultation = consultationService.updateConsultation(id, consultationDetails);
        return ResponseEntity.ok(ApiResponse.success(updatedConsultation));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteConsultation(@PathVariable Long id) {
        consultationService.deleteConsultation(id);
        return ResponseEntity.ok(ApiResponse.success("Consultation deleted successfully"));
    }
}
