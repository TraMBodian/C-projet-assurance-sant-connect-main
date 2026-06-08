package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.UserDto;
import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.AuditLogService;
import com.assurance.sante.connect.service.UserService;
import com.assurance.sante.connect.security.JwtAuthenticationToken;
import com.assurance.sante.connect.security.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService     userService;
    private final AuditLogService auditLogService;
    private final ClientIpResolver clientIpResolver;

    private boolean isAdmin(Authentication auth) {
        if (!(auth instanceof JwtAuthenticationToken jwt)) return false;
        try {
            UserDto user = userService.getUserByEmail(jwt.getEmail());
            return "ADMIN".equals(user.getRole());
        } catch (Exception e) { return false; }
    }

    /** Réservé aux admins */
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllUsers(Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(Map.of("users", users)));
    }

    /** Endpoint paginé : GET /api/users/paginated?page=0&size=20&search=...&role=ADMIN&status=ACTIVE */
    @GetMapping("/paginated")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsersPaginated(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    String search,
            @RequestParam(required = false)    String role,
            @RequestParam(required = false)    String status,
            Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        List<UserDto> all = userService.getAllUsers();
        String q = search != null ? search.toLowerCase() : null;
        List<UserDto> filtered = all.stream()
            .filter(u -> q == null || q.isBlank()
                || (u.getFullName() != null && u.getFullName().toLowerCase().contains(q))
                || (u.getEmail()    != null && u.getEmail().toLowerCase().contains(q)))
            .filter(u -> role   == null || role.isBlank()   || role.equalsIgnoreCase(u.getRole()))
            .filter(u -> status == null || status.isBlank() || status.equalsIgnoreCase(u.getStatus()))
            .collect(Collectors.toList());
        int total = filtered.size();
        int from  = Math.min(page * size, total);
        int to    = Math.min(from + size, total);
        List<UserDto> pageContent = filtered.subList(from, to);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "users",         pageContent,
            "totalElements", total,
            "totalPages",    (int) Math.ceil((double) total / size),
            "page",          page,
            "size",          size
        )));
    }

    /** Admin : n'importe quel user. Utilisateur : seulement son propre profil */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id, Authentication auth) {
        if (!isAdmin(auth)) {
            if (!(auth instanceof JwtAuthenticationToken jwt)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
            UserDto self = userService.getUserByEmail(jwt.getEmail());
            if (!self.getId().equals(id)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        }
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /** Admin : mise à jour complète. Utilisateur : uniquement son propre profil (sans changer role/status) */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable Long id,
            @RequestBody UserDto userDto,
            Authentication auth) {
        boolean admin = isAdmin(auth);
        if (!admin) {
            if (!(auth instanceof JwtAuthenticationToken jwt)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
            UserDto self = userService.getUserByEmail(jwt.getEmail());
            if (!self.getId().equals(id)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
            // Un non-admin ne peut pas modifier son rôle ou statut
            userDto.setRole(null);
            userDto.setStatus(null);
        }
        UserDto updatedUser = userService.updateUser(id, userDto);
        return ResponseEntity.ok(ApiResponse.success(updatedUser));
    }

    /** Changement de mot de passe : admin ou propriétaire du compte */
    @PostMapping("/{id}/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication auth,
            HttpServletRequest req) {
        String callerEmail = auth instanceof JwtAuthenticationToken jwt ? jwt.getEmail() : "unknown";
        if (!isAdmin(auth)) {
            if (!(auth instanceof JwtAuthenticationToken jwt)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
            UserDto self = userService.getUserByEmail(jwt.getEmail());
            if (!self.getId().equals(id)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        }
        String currentPassword = body.get("currentPassword");
        String newPassword     = body.get("newPassword");
        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Champs manquants"));
        }
        if (!com.assurance.sante.connect.security.PasswordPolicy.isValid(newPassword)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(
                com.assurance.sante.connect.security.PasswordPolicy.REQUIREMENTS_MESSAGE));
        }
        try {
            userService.changePassword(id, currentPassword, newPassword);
            auditLogService.log("PASSWORD_CHANGE", "USER", id,
                callerEmail, isAdmin(auth) ? "ADMIN" : "CLIENT",
                "Mot de passe modifié pour userId=" + id,
                resolveIp(req));
            return ResponseEntity.ok(ApiResponse.success("Mot de passe mis à jour"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Réservé aux admins */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @PathVariable Long id,
            Authentication auth,
            HttpServletRequest req) {
        if (!isAdmin(auth)) return ResponseEntity.status(403).body(ApiResponse.error("Accès refusé"));
        UserDto target = userService.getUserById(id);
        userService.deleteUser(id);
        String caller = auth instanceof JwtAuthenticationToken jwt ? jwt.getEmail() : "unknown";
        auditLogService.log("USER_DELETE", "USER", id, caller, "ADMIN",
            "Suppression du compte : " + target.getEmail(),
            resolveIp(req));
        return ResponseEntity.ok(ApiResponse.success("Utilisateur supprimé"));
    }

    private String resolveIp(HttpServletRequest req) {
        return clientIpResolver.resolve(req);
    }
}
