package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.dto.DocumentMedicalDto;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.entity.DocumentMedical;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.repository.ConsultationRepository;
import com.assurance.sante.connect.repository.DocumentMedicalRepository;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.service.MedicalAccessService;
import com.assurance.sante.connect.service.MedicalAuditService;
import com.assurance.sante.connect.security.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentMedicalRepository documentRepository;
    private final UserRepository userRepository;
    private final AssureRepository assureRepository;
    private final ConsultationRepository consultationRepository;
    private final MedicalAccessService medicalAccessService;
    private final MedicalAuditService medicalAuditService;
    private final ClientIpResolver clientIpResolver;

    @Value("${app.upload-dir:/app/uploads}")
    private String uploadDir;

    private static final Tika TIKA = new Tika();

    private static final List<String> ALLOWED_TYPES = List.of(
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE')")
    public ResponseEntity<ApiResponse<DocumentMedicalDto>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "assureId",      required = false) Long assureId,
            @RequestParam(value = "consultationId", required = false) Long consultationId,
            @RequestParam(value = "description",    required = false) String description,
            Authentication auth) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Fichier vide"));
        }

        if (file.getSize() > 10L * 1024 * 1024) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Fichier trop volumineux (max 10 Mo)"));
        }

        // Détection du type réel via magic bytes (Apache Tika) — résiste à la falsification du Content-Type
        String detectedType;
        try {
            detectedType = TIKA.detect(file.getInputStream());
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Impossible de lire le fichier"));
        }
        if (!ALLOWED_TYPES.contains(detectedType)) {
            log.warn("Upload refusé — type détecté: {} (déclaré: {}) par {}", detectedType, file.getContentType(), auth.getName());
            return ResponseEntity.badRequest().body(ApiResponse.error(
                "Type de fichier non autorisé. Types acceptés : PDF, JPEG, PNG, DOC, DOCX"));
        }

        // Anti auto-association : un PRESTATAIRE ne peut rattacher un document qu'à un
        // patient/consultation qui lui sont accessibles (ADMIN : aucune restriction).
        if (medicalAccessService.isPrestataire(auth)) {
            if (consultationId != null && !medicalAccessService.canWriteConsultation(auth, consultationId)) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : cette consultation ne vous est pas accessible"));
            }
            if (consultationId == null && assureId != null && !medicalAccessService.canAccessPatient(auth, assureId)) {
                return ResponseEntity.status(403)
                    .body(ApiResponse.error("Accès refusé : ce patient ne vous est pas associé"));
            }
        }

        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        String extension = "";
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            String ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
            // Whitelist extensions autorisées — évite l'exécution côté serveur
            if (List.of(".pdf", ".jpg", ".jpeg", ".png", ".gif", ".doc", ".docx").contains(ext)) {
                extension = ext;
            }
        }
        String fileName = UUID.randomUUID() + extension;
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        String contentType = detectedType;

        DocumentMedical doc = new DocumentMedical();
        doc.setNom(originalName != null ? originalName : fileName);
        doc.setContentType(contentType);
        doc.setTaille(file.getSize());
        doc.setChemin(fileName);
        doc.setDescription(description);

        if (assureId != null) {
            assureRepository.findById(assureId).ifPresent(doc::setAssure);
        }
        if (consultationId != null) {
            consultationRepository.findById(consultationId).ifPresent(doc::setConsultation);
        }
        userRepository.findByEmail(auth.getName()).ifPresent(doc::setUploadedBy);

        DocumentMedical saved = documentRepository.save(doc);
        log.info("Document uploadé: {} par {}", fileName, auth.getName());

        return ResponseEntity.ok(ApiResponse.success(DocumentMedicalDto.fromEntity(saved)));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long id, Authentication auth, HttpServletRequest request) throws MalformedURLException {
        DocumentMedical doc = documentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Document introuvable: " + id));

        // Contrôle d'accès centralisé : ADMIN, CLIENT propriétaire, ou PRESTATAIRE associé
        if (!medicalAccessService.canAccessDocument(auth, doc)) {
            return ResponseEntity.status(403).build();
        }
        medicalAuditService.logAccess(auth, "DOCUMENT", id, clientIpResolver.resolve(request));

        Path filePath = Paths.get(uploadDir).resolve(doc.getChemin());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(doc.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + doc.getNom() + "\"")
            .body(resource);
    }

    /**
     * Upload de document par un CLIENT pour ses propres pièces justificatives.
     * L'assureId est résolu automatiquement depuis le compte connecté — le CLIENT
     * ne peut jamais uploader au nom d'un autre assuré.
     */
    @PostMapping(value = "/client-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRESTATAIRE', 'CLIENT')")
    public ResponseEntity<ApiResponse<DocumentMedicalDto>> clientUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "consultationId", required = false) Long consultationId,
            @RequestParam(value = "description",    required = false) String description,
            Authentication auth) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Fichier vide"));
        }

        if (file.getSize() > 10L * 1024 * 1024) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Fichier trop volumineux (max 10 Mo)"));
        }

        // Détection du type réel via magic bytes (Apache Tika) — résiste à la falsification du Content-Type
        String detectedType;
        try {
            detectedType = TIKA.detect(file.getInputStream());
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Impossible de lire le fichier"));
        }
        if (!ALLOWED_TYPES.contains(detectedType)) {
            log.warn("Upload client refusé — type détecté: {} (déclaré: {}) par {}",
                detectedType, file.getContentType(), auth.getName());
            return ResponseEntity.badRequest().body(ApiResponse.error(
                "Type de fichier non autorisé. Types acceptés : PDF, JPEG, PNG, DOC, DOCX"));
        }

        // Résolution de l'assuré à partir du compte connecté — pas de paramètre assureId
        Assure myAssure = assureRepository.findByEmail(auth.getName()).orElse(null);

        Path uploadPath = Paths.get(uploadDir);
        Files.createDirectories(uploadPath);

        String originalName = file.getOriginalFilename();
        String extension = "";
        if (originalName != null && originalName.contains(".")) {
            String ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
            // Whitelist d'extensions — évite l'exécution côté serveur
            if (List.of(".pdf", ".jpg", ".jpeg", ".png", ".gif", ".doc", ".docx").contains(ext)) {
                extension = ext;
            }
        }
        String fileName = UUID.randomUUID() + extension;
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        DocumentMedical doc = new DocumentMedical();
        doc.setNom(originalName != null ? originalName : fileName);
        doc.setContentType(detectedType);
        doc.setTaille(file.getSize());
        doc.setChemin(fileName);
        doc.setDescription(description);

        if (myAssure != null) doc.setAssure(myAssure);
        if (consultationId != null) {
            consultationRepository.findById(consultationId).ifPresent(doc::setConsultation);
        }
        userRepository.findByEmail(auth.getName()).ifPresent(doc::setUploadedBy);

        DocumentMedical saved = documentRepository.save(doc);
        log.info("Document client uploadé: {} par {}", fileName, auth.getName());

        return ResponseEntity.ok(ApiResponse.success(DocumentMedicalDto.fromEntity(saved)));
    }

    @GetMapping("/consultation/{consultationId}")
    public ResponseEntity<ApiResponse<List<DocumentMedicalDto>>> byConsultation(
            @PathVariable Long consultationId, Authentication auth, HttpServletRequest request) {
        // Contrôle d'accès centralisé : ADMIN, CLIENT propriétaire, ou PRESTATAIRE associé
        if (!medicalAccessService.canAccessConsultation(auth, consultationId)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : cette consultation ne vous est pas accessible"));
        }
        medicalAuditService.logAccess(auth, "DOCUMENT_CONSULTATION", consultationId, clientIpResolver.resolve(request));
        List<DocumentMedicalDto> docs = documentRepository.findByConsultationId(consultationId)
            .stream().map(DocumentMedicalDto::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @GetMapping("/assure/{assureId}")
    public ResponseEntity<ApiResponse<List<DocumentMedicalDto>>> byAssure(
            @PathVariable Long assureId, Authentication auth, HttpServletRequest request) {
        // Contrôle d'accès centralisé : ADMIN, CLIENT propriétaire, ou PRESTATAIRE associé au patient
        if (!medicalAccessService.canAccessPatient(auth, assureId)) {
            return ResponseEntity.status(403)
                .body(ApiResponse.error("Accès refusé : ce dossier ne vous est pas accessible"));
        }
        medicalAuditService.logAccess(auth, "DOCUMENT_ASSURE", assureId, clientIpResolver.resolve(request));
        List<DocumentMedicalDto> docs = documentRepository.findByAssureId(assureId)
            .stream().map(DocumentMedicalDto::fromEntity).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(docs));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> delete(@PathVariable Long id) throws IOException {
        DocumentMedical doc = documentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Document introuvable: " + id));

        Path filePath = Paths.get(uploadDir).resolve(doc.getChemin());
        Files.deleteIfExists(filePath);
        documentRepository.delete(doc);

        return ResponseEntity.ok(ApiResponse.success("Document supprimé"));
    }
}
