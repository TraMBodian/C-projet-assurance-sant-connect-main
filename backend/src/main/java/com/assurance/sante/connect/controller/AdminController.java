package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.entity.ActiveSession;
import com.assurance.sante.connect.service.ActiveSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ActiveSessionService activeSessionService;

    @GetMapping("/active-users")
    public ResponseEntity<ApiResponse<List<ActiveSession>>> getActiveUsers() {
        return ResponseEntity.ok(ApiResponse.success(activeSessionService.getActiveSessions()));
    }
}
