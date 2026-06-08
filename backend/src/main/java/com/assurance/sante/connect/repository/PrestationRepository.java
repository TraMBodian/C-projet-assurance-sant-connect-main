package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Prestation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrestationRepository extends JpaRepository<Prestation, Long> {
    List<Prestation> findByType(Prestation.TypePrestation type);
    List<Prestation> findByTypeIn(List<Prestation.TypePrestation> types);
    List<Prestation> findByAssureId(Long assureId);
    long countByPrestataireDemandeurId(Long prestataireDemandeurId);
}
