package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/photos")
@Slf4j
public class PhotoController {

    private static final List<String> ALLOWED_TYPES = List.of(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_SIZE = 2L * 1024 * 1024; // 2 Mo
    private static final Tika TIKA = new Tika();

    @Value("${app.upload-dir:/app/uploads}")
    private String uploadDir;

    /** Upload d'une photo de profil — renvoie l'URL relative pour y accéder */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Fichier vide"));
        }
        if (file.getSize() > MAX_SIZE) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Photo trop volumineuse (max 2 Mo)"));
        }
        // Détection du type réel via magic bytes (Apache Tika) — résiste à la falsification du Content-Type
        String detectedType;
        try {
            detectedType = TIKA.detect(file.getInputStream());
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Impossible de lire le fichier"));
        }
        if (!ALLOWED_TYPES.contains(detectedType)) {
            log.warn("Upload photo refusé — type détecté: {} (déclaré: {})", detectedType, file.getContentType());
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Type non autorisé. Formats acceptés : JPEG, PNG, WEBP, GIF"));
        }

        // Extension dérivée du type réel détecté (whitelist) — pas du nom de fichier client
        String ext = switch (detectedType) {
            case "image/png"  -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif"  -> ".gif";
            default            -> ".jpg";
        };

        Path photosDir = Paths.get(uploadDir, "photos");
        Files.createDirectories(photosDir);

        String filename = UUID.randomUUID() + ext;
        Files.copy(file.getInputStream(), photosDir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        log.info("Photo uploadée : {}", filename);

        String url = "/api/photos/" + filename;
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", url)));
    }

    /** Sert une photo depuis le disque — public pour permettre l'affichage dans le navigateur */
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> serve(@PathVariable String filename) throws MalformedURLException {
        // Sécurité : empêcher la traversée de répertoires
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.badRequest().build();
        }

        Path file = Paths.get(uploadDir, "photos", filename);
        Resource resource = new UrlResource(file.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = "image/jpeg";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png"))  contentType = "image/png";
        if (lower.endsWith(".webp")) contentType = "image/webp";
        if (lower.endsWith(".gif"))  contentType = "image/gif";

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
            .body(resource);
    }
}
