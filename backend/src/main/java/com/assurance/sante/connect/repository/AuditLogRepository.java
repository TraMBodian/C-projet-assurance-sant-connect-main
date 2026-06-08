package com.assurance.sante.connect.repository;

import com.assurance.sante.connect.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:search IS NULL OR LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.userEmail) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.entity) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:action IS NULL OR UPPER(a.action) = UPPER(:action)) " +
           "AND (:entity IS NULL OR UPPER(a.entity) = UPPER(:entity))")
    Page<AuditLog> findWithFilters(
        @Param("search") String search,
        @Param("action") String action,
        @Param("entity") String entity,
        Pageable pageable
    );

    long countByCreatedAtBefore(LocalDateTime cutoff);

    @Modifying
    @Transactional
    @Query("DELETE FROM AuditLog a WHERE a.createdAt < :cutoff")
    void deleteByCreatedAtBefore(@Param("cutoff") LocalDateTime cutoff);
}
