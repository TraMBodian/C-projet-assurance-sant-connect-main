package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.Assure;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AssureRepository extends JpaRepository<Assure, Long> {
    Optional<Assure> findByNumero(String numero);
    Optional<Assure> findByEmail(String email);
    java.util.List<Assure> findByNumeroStartingWith(String prefix);
    void deleteByNumeroStartingWith(String prefix);
    java.util.List<Assure> findByFamilleId(Long familleId);

    @Query("SELECT a FROM Assure a WHERE " +
           "(:search IS NULL OR LOWER(a.nom) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.prenom) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.numero) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:statut IS NULL OR UPPER(a.statut) = UPPER(:statut)) " +
           "AND (:type IS NULL OR UPPER(a.type) = UPPER(:type))")
    Page<Assure> findWithFilters(
        @Param("search") String search,
        @Param("statut") String statut,
        @Param("type")   String type,
        Pageable pageable
    );
}
