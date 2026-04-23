package com.assurance.sante.connect.controller;

import com.assurance.sante.connect.dto.ApiResponse;
import com.assurance.sante.connect.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<String>> sendEmail(@RequestBody Map<String, String> request) {
        String to = request.get("to");
        String subject = request.get("subject");
        String body = request.get("body");
        
        emailService.sendEmail(to, subject, body);
        return ResponseEntity.ok(ApiResponse.success("Email sent successfully"));
    }

    @PostMapping("/temp-mapping")
    public ResponseEntity<ApiResponse<String>> storeTempEmailMapping(@RequestBody Map<String, String> request) {
        String tempEmail = request.get("temp_email");
        String realEmail = request.get("real_email");
        
        emailService.storeTempEmailMapping(tempEmail, realEmail);
        return ResponseEntity.ok(ApiResponse.success("Temp email mapping stored"));
    }

    @GetMapping("/real-email")
    public ResponseEntity<ApiResponse<Map<String, String>>> getRealEmail(@RequestParam String tempEmail) {
        String realEmail = emailService.getRealEmail(tempEmail);
        return ResponseEntity.ok(ApiResponse.success(Map.of("real_email", realEmail)));
    }

    @PutMapping("/confirm")
    public ResponseEntity<ApiResponse<String>> confirmEmail(@RequestBody Map<String, String> request) {
        String tempEmail = request.get("temp_email");
        emailService.confirmEmail(tempEmail);
        return ResponseEntity.ok(ApiResponse.success("Email confirmed"));
    }
}
