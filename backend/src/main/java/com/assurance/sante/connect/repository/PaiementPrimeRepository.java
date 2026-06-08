package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.PaiementPrime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaiementPrimeRepository extends JpaRepository<PaiementPrime, Long> {
    Optional<PaiementPrime> findByNumero(String numero);
    List<PaiementPrime> findByPoliceIdOrderByDateEcheanceDesc(Long policeId);
    List<PaiementPrime> findByAssureIdOrderByDateEcheanceDesc(Long assureId);
    List<PaiementPrime> findByStatutOrderByDateEcheanceAsc(PaiementPrime.StatutPaiement statut);
    List<PaiementPrime> findAllByOrderByDateEcheanceDesc();
}
