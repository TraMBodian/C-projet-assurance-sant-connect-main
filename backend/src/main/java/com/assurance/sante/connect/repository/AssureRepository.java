package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Assure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AssureRepository extends JpaRepository<Assure, Long> {
    Optional<Assure> findByNumero(String numero);
    java.util.List<Assure> findByNumeroStartingWith(String prefix);
    void deleteByNumeroStartingWith(String prefix);
}
