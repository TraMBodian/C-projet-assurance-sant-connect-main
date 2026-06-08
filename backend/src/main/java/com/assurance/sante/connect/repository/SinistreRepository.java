package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Sinistre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SinistreRepository extends JpaRepository<Sinistre, Long> {
    Optional<Sinistre> findByNumero(String numero);
    List<Sinistre> findByAssureId(Long assureId);
}
