package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Prescription;
import com.assurance.sante.connect.repository.PrescriptionRepository;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;

    @Transactional(readOnly = true)
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Prescription getPrescriptionById(Long id) {
        return prescriptionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
    }

    public Prescription createPrescription(Prescription prescription) {
        return prescriptionRepository.save(prescription);
    }

    public Prescription updatePrescription(Long id, Prescription prescriptionDetails) {
        Prescription prescription = prescriptionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));

        if (prescriptionDetails.getMedicament() != null) prescription.setMedicament(prescriptionDetails.getMedicament());
        if (prescriptionDetails.getDosage() != null) prescription.setDosage(prescriptionDetails.getDosage());
        if (prescriptionDetails.getDuree() != null) prescription.setDuree(prescriptionDetails.getDuree());
        if (prescriptionDetails.getInstructions() != null) prescription.setInstructions(prescriptionDetails.getInstructions());

        return prescriptionRepository.save(prescription);
    }

    public void deletePrescription(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        prescriptionRepository.delete(prescription);
    }
}
