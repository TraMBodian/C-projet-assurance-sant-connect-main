package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    java.util.List<Consultation> findByPrestataireId(Long prestataireId);
    java.util.List<Consultation> findByAssureId(Long assureId);
    long countByPrestataireId(Long prestataireId);
}
