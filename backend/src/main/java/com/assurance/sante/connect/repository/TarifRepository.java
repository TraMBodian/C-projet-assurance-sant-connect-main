package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Tarif;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TarifRepository extends JpaRepository<Tarif, Long> {
    Optional<Tarif> findTopByOrderByUpdatedAtDesc();
}
