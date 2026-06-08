package com.assurance.sante.connect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents_medicaux", indexes = {
    @Index(name = "idx_doc_assure_id",       columnList = "assure_id"),
    @Index(name = "idx_doc_consultation_id",  columnList = "consultation_id"),
    @Index(name = "idx_doc_uploaded_by",      columnList = "uploaded_by_id"),
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    private Long taille;

    @Column(nullable = false)
    private String chemin;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assure_id")
    private Assure assure;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id")
    private User uploadedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
