package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.AvenantContrat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AvenantContratRepository extends JpaRepository<AvenantContrat, Long> {
    List<AvenantContrat> findByAssureEmailOrderByCreatedAtDesc(String email);
    List<AvenantContrat> findAllByOrderByCreatedAtDesc();
    List<AvenantContrat> findByStatutOrderByCreatedAtDesc(AvenantContrat.StatutAvenant statut);
    List<AvenantContrat> findByPoliceIdOrderByCreatedAtDesc(Long policeId);
    Optional<AvenantContrat> findByNumero(String numero);
}
