package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.AuditLog;
import com.assurance.sante.connect.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(String action, String entity, Long entityId,
                    String userEmail, String userRole, String detail, String ip) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .entity(entity)
                .entityId(entityId)
                .userEmail(userEmail)
                .userRole(userRole)
                .detail(detail)
                .ipAddress(ip)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getLogs(String search, String action, String entity, Pageable pageable) {
        String s = (search != null && !search.isBlank()) ? search.trim() : null;
        String a = (action != null && !action.isBlank()) ? action.trim() : null;
        String e = (entity != null && !entity.isBlank()) ? entity.trim() : null;
        return auditLogRepository.findWithFilters(s, a, e, pageable);
    }

    /** Supprime les entrées antérieures à la date indiquée. Retourne le nombre supprimé. */
    public long purge(LocalDateTime before) {
        long count = auditLogRepository.countByCreatedAtBefore(before);
        auditLogRepository.deleteByCreatedAtBefore(before);
        return count;
    }
}
