package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.PatientProviderAssignment;
import com.assurance.sante.connect.entity.PatientProviderAssignment.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientProviderAssignmentRepository extends JpaRepository<PatientProviderAssignment, Long> {

    boolean existsByPrestataireIdAndAssureIdAndStatus(Long prestataireId, Long assureId, AssignmentStatus status);

    Optional<PatientProviderAssignment> findByPrestataireIdAndAssureId(Long prestataireId, Long assureId);

    List<PatientProviderAssignment> findByPrestataireIdAndStatus(Long prestataireId, AssignmentStatus status);

    List<PatientProviderAssignment> findByAssureIdAndStatus(Long assureId, AssignmentStatus status);

    List<PatientProviderAssignment> findByPrestataireId(Long prestataireId);

    List<PatientProviderAssignment> findByAssureId(Long assureId);
}
