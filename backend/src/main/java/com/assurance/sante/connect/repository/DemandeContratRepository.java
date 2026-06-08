package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.DemandeContrat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DemandeContratRepository extends JpaRepository<DemandeContrat, Long> {
    List<DemandeContrat> findByAssureEmailOrderByCreatedAtDesc(String email);
    List<DemandeContrat> findAllByOrderByCreatedAtDesc();
    List<DemandeContrat> findByStatutOrderByCreatedAtDesc(DemandeContrat.StatutDemande statut);
}
