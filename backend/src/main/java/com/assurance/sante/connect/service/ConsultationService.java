package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Consultation;
import com.assurance.sante.connect.repository.ConsultationRepository;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsultationService {

    private final ConsultationRepository consultationRepository;

    @Transactional(readOnly = true)
    public List<Consultation> getAllConsultations() {
        return consultationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Consultation getConsultationById(Long id) {
        return consultationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));
    }

    public Consultation createConsultation(Consultation consultation) {
        return consultationRepository.save(consultation);
    }

    public Consultation updateConsultation(Long id, Consultation consultationDetails) {
        Consultation consultation = consultationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        if (consultationDetails.getMotif() != null) consultation.setMotif(consultationDetails.getMotif());
        if (consultationDetails.getDiagnostic() != null) consultation.setDiagnostic(consultationDetails.getDiagnostic());
        if (consultationDetails.getStatut() != null) consultation.setStatut(consultationDetails.getStatut());
        if (consultationDetails.getDateConsultation() != null) consultation.setDateConsultation(consultationDetails.getDateConsultation());
        if (consultationDetails.getMotifAnnulation() != null) consultation.setMotifAnnulation(consultationDetails.getMotifAnnulation());
        consultation.setUpdatedAt(java.time.LocalDateTime.now());

        return consultationRepository.save(consultation);
    }

    public Consultation updateStatut(Long id, Consultation.ConsultationStatut statut, String motifAnnulation) {
        Consultation consultation = consultationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));

        consultation.setStatut(statut);
        if (motifAnnulation != null) consultation.setMotifAnnulation(motifAnnulation);
        consultation.setUpdatedAt(java.time.LocalDateTime.now());

        return consultationRepository.save(consultation);
    }

    public void deleteConsultation(Long id) {
        Consultation consultation = consultationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Consultation not found with id: " + id));
        consultationRepository.delete(consultation);
    }
}
