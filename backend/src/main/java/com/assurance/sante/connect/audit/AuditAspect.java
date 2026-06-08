package com.assurance.sante.connect.audit;

import com.assurance.sante.connect.service.AuditLogService;
import com.assurance.sante.connect.security.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

/**
 * Aspect AOP d'audit automatique.
 *
 * Intercepte tous les endpoints d'écriture (POST/PUT/PATCH/DELETE)
 * dans le package controller et enregistre un événement dans audit_logs.
 *
 * Actions générées automatiquement :
 *   POST   → CREATE
 *   PUT    → UPDATE
 *   PATCH  → UPDATE
 *   DELETE → DELETE
 *
 * L'entité et l'ID sont déduits du nom du controller et du chemin.
 * Pour les événements métier fins (LOGIN, LOGOUT…), les controllers
 * appellent directement auditLogService.log().
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;
    private final ClientIpResolver clientIpResolver;

    @Around("within(com.assurance.sante.connect.controller..*) && " +
            "(@annotation(org.springframework.web.bind.annotation.PostMapping)   || " +
            " @annotation(org.springframework.web.bind.annotation.PutMapping)    || " +
            " @annotation(org.springframework.web.bind.annotation.PatchMapping)  || " +
            " @annotation(org.springframework.web.bind.annotation.DeleteMapping))")
    public Object auditWrite(ProceedingJoinPoint pjp) throws Throwable {

        Object result = pjp.proceed(); // exécuter d'abord la méthode

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return result;
            }

            String email   = auth.getName();
            String role    = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst().orElse("UNKNOWN")
                .replace("ROLE_", "");

            String ip = resolveIp();

            Method method  = ((MethodSignature) pjp.getSignature()).getMethod();
            String action  = resolveAction(method);
            String entity  = resolveEntity(pjp.getTarget().getClass().getSimpleName());
            Long   entityId = resolveEntityId(pjp.getArgs());
            String detail  = buildDetail(method, pjp.getArgs(), entity, entityId);

            auditLogService.log(action, entity, entityId, email, role, detail, ip);

        } catch (Exception e) {
            log.warn("AuditAspect: erreur lors de l'enregistrement (non bloquant) — {}", e.getMessage());
        }

        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveAction(Method method) {
        if (method.isAnnotationPresent(PostMapping.class))   return "CREATE";
        if (method.isAnnotationPresent(PutMapping.class))    return "UPDATE";
        if (method.isAnnotationPresent(PatchMapping.class))  return "UPDATE";
        if (method.isAnnotationPresent(DeleteMapping.class)) return "DELETE";
        return "WRITE";
    }

    private String resolveEntity(String controllerName) {
        // "AssureController" → "ASSURE", "PoliceController" → "POLICE", etc.
        return controllerName
            .replace("Controller", "")
            .replaceAll("([A-Z])", "_$1")
            .replaceFirst("^_", "")
            .toUpperCase();
    }

    private Long resolveEntityId(Object[] args) {
        if (args == null) return null;
        for (Object arg : args) {
            if (arg instanceof Long l) return l;
            if (arg instanceof Integer i) return i.longValue();
        }
        return null;
    }

    private String buildDetail(Method method, Object[] args, String entity, Long entityId) {
        StringBuilder sb = new StringBuilder(method.getName());
        if (entityId != null) sb.append(" id=").append(entityId);
        return sb.toString();
    }

    private String resolveIp() {
        try {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            return clientIpResolver.resolve(attrs.getRequest());
        } catch (Exception e) {
            return null;
        }
    }
}
