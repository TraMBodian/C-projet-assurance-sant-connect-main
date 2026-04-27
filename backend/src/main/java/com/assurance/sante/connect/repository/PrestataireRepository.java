package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Prestataire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PrestataireRepository extends JpaRepository<Prestataire, Long> {
    Optional<Prestataire> findByNumero(String numero);
    boolean existsByNumero(String numero);
}
