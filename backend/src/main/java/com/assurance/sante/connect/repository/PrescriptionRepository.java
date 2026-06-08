package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByConsultationAssureId(Long assureId);
    List<Prescription> findByConsultationPrestataireId(Long prestataireId);
}
