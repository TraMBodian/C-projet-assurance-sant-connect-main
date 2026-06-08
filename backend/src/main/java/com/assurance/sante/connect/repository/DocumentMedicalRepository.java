package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.DocumentMedical;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentMedicalRepository extends JpaRepository<DocumentMedical, Long> {
    List<DocumentMedical> findByAssureId(Long assureId);
    List<DocumentMedical> findByConsultationId(Long consultationId);
    List<DocumentMedical> findByUploadedById(Long userId);
}
