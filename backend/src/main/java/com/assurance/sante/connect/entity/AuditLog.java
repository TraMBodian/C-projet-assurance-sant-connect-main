package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_user",   columnList = "userEmail"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_date",   columnList = "createdAt"),
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String action;        // ex: ASSURE_CREATE, USER_DELETE, TARIF_UPDATE

    @Column(nullable = false, length = 100)
    private String entity;        // ex: Assure, User, Tarif

    private Long entityId;        // ID de l'entité concernée

    @Column(length = 150)
    private String userEmail;     // Email de l'admin/acteur

    @Column(length = 100)
    private String userRole;      // ADMIN, CLIENT, PRESTATAIRE

    @Column(columnDefinition = "TEXT")
    private String detail;        // JSON ou description libre

    @Column(length = 50)
    private String ipAddress;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
