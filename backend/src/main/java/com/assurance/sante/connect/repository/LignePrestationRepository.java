package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.LignePrestation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface LignePrestationRepository extends JpaRepository<LignePrestation, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<LignePrestation> findLockedById(Long id);

    List<LignePrestation> findByPrestationId(Long prestationId);
    long countByFourniParId(Long fourniParId);
}
