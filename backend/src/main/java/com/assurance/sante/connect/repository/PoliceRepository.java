package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.Police;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PoliceRepository extends JpaRepository<Police, Long> {
    Optional<Police> findByNumero(String numero);
    void deleteByAssure(Assure assure);
}
